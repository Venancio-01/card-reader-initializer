const usb = require('usb');

// 定义与 C 代码相同的常量
const REQUEST_TYPE = 0x21;  // LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE
const HID_REPORT_SET = 0x09;
const HID_RT_OUTPUT = 0x02;
const REQUEST = 0xC7;
const VALUE = 0x83CC;
const INDEX = 0x10;

async function initializeDevice() {
  try {
    const device = usb.findByIds(6790, 57360);
    if (!device) {
      throw new Error('设备未找到');
    }

    device.open();

    const interface = device.interface(0);
    if (interface.isKernelDriverActive()) {
      interface.detachKernelDriver();
    }
    interface.claim();

    // 按照 C 代码准备数据
    const data = Buffer.alloc(32);
    const m_str = Buffer.alloc(5);

    // 复制 C 代码中的数据准备逻辑
    m_str[2] = 0x83;
    m_str[3] = 0xCC;
    m_str[4] = 30;
    m_str[0] |= 0x01;
    m_str[1] &= ~0x08;
    m_str[1] |= 0x04;
    m_str[1] |= 0x3;

    m_str[0] = 0xFF;
    m_str[1] |= 0xC0;

    m_str.copy(data, 0, 0, 5);

    // 使用与 C 代码相同的控制传输参数
    await device.controlTransfer(
      REQUEST_TYPE,
      HID_REPORT_SET,
      HID_RT_OUTPUT << 8,
      0x00,
      data,
      2000  // 超时时间设置为 2000ms，与 C 代码一致
    );

    console.log('设备初始化成功');

    // 设置清理函数
    process.on('SIGINT', () => {
      interface.release(() => {
        interface.attachKernelDriver();
        device.close();
        console.log('设备已关闭');
        process.exit();
      });
    });

    return device;

  } catch (error) {
    console.error('初始化设备失败:', error);
    throw error;
  }
}

initializeDevice().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
