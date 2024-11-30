const HID = require('node-hid');

// 定义常量
const TARGET_VID = 6790;  // 对应C代码中的 desc.idVendor
const TARGET_PID = 57360; // 对应C代码中的 desc.idProduct

async function initializeDevice() {
  try {
    // 查找设备
    const deviceInfo = HID.devices().find(
      d => d.vendorId === TARGET_VID && d.productId === TARGET_PID
    );
    
    if (!deviceInfo) {
      throw new Error('设备未找到');
    }

    // 打开设备
    const device = new HID.HID(deviceInfo.path);
    
    // 准备发送的数据(对应C代码中的数据结构)
    const data = Buffer.alloc(32); // 对应C代码中的buf
    const m_str = Buffer.alloc(5);

    // 设置控制数据，完全匹配C代码的实现
    m_str[0] = 0xFF;           // m_str[0] = 0xFF
    m_str[1] = 0xC0;           // m_str[1] |= 0xC0
    m_str[2] = 0x83;           // m_str[2] = 0x83
    m_str[3] = 0xCC;           // m_str[3] = 0xCC
    m_str[4] = 30;             // m_str[4] = 30

    // 复制控制数据到发送缓冲区
    m_str.copy(data, 0, 0, 5);

    // 发送数据
    device.write(data);
    
    // 设置数据接收监听
    device.on('data', (data) => {
      console.log('收到数据:', data);
    });

    device.on('error', (error) => {
      console.error('设备错误:', error);
    });

    return device;
    
  } catch (error) {
    console.error('初始化设备失败:', error);
    throw error;
  }
}

// 使用示例
async function main() {
  try {
    console.log('正在初始化设备...');
    const device = await initializeDevice();
    console.log('设备初始化成功');
    
    // 程序结束时关闭设备
    process.on('SIGINT', () => {
      device.close();
      console.log('设备已关闭');
      process.exit();
    });
    
  } catch (error) {
    console.error('程序执行失败:', error);
    process.exit(1);
  }
}

main();
