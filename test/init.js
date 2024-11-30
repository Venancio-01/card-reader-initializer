const usb = require('usb');

const REQUEST_TYPE = 0x21;  // LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE
const HID_REPORT_SET = 0x09;
const HID_RT_OUTPUT = 0x02;

async function initializeDevice() {
  try {
    // 查找设备
    const device = usb.findByIds(6790, 57360);
    if (!device) {
      throw new Error('设备未找到');
    }

    // 打开设备
    device.open();

    // 声明接口
    const interface = device.interface(0);
    if (interface.isKernelDriverActive()) {
      interface.detachKernelDriver();
    }
    interface.claim();

    // 准备控制传输数据
    const data = Buffer.alloc(32);
    const controlData = Buffer.from([
      0xFF,   // m_str[0]
      0xC0,   // m_str[1]
      0x83,   // m_str[2]
      0xCC,   // m_str[3]
      30      // m_str[4]
    ]);
    controlData.copy(data, 0, 0, 5);

    // 发送控制传输
    await device.controlTransfer(
      REQUEST_TYPE,
      HID_REPORT_SET,
      HID_RT_OUTPUT << 8,
      0x00,
      data
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

initializeDevice()
