const HID = require('node-hid');
const readline = require('readline');

// 创建命令行输入接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 列出所有设备
function listAllDevices() {
    const devices = HID.devices();
    console.log('\n=== 可用的 HID 设备列表 ===');
    devices.forEach((device, index) => {
        console.log(`
设备 ${index + 1}:
    供应商ID (VID): ${device.vendorId} (0x${device.vendorId.toString(16)})
    产品ID (PID): ${device.productId} (0x${device.productId.toString(16)})
    产品名称: ${device.product || '未知'}
    制造商: ${device.manufacturer || '未知'}
    路径: ${device.path}
    `);
    });
    return devices;
}

// 连接设备
function connectDevice(vid, pid) {
    const deviceInfo = HID.devices().find(d => d.vendorId === vid && d.productId === pid);
    if (!deviceInfo) {
        console.log(`未找到 VID: ${vid}, PID: ${pid} 的设备`);
        return null;
    }

    try {
        console.log(`正在连接设备: VID: ${vid}, PID: ${pid}`);
        const device = new HID.HID(deviceInfo.path);
        console.log('设备连接成功！');
        return device;
    } catch (error) {
        console.error('连接设备失败:', error);
        return null;
    }
}

// 设置设备监听
function setupDeviceListeners(device) {
    device.on('data', (data) => {
        console.log('接收到数据：', data);
    });

    device.on('error', (error) => {
        console.error('发生错误：', error);
    });

    process.on('SIGINT', () => {
        device.close();
        console.log('\n设备已断开连接');
        process.exit();
    });
}

// 主程序
async function main() {
    const devices = listAllDevices();
    
    if (devices.length === 0) {
        console.log('未检测到任何 HID 设备');
        process.exit(1);
    }

    // 提示用户输入 VID
    const vidPromise = new Promise((resolve) => {
        rl.question('\n请输入设备的 VID (十进制): ', (answer) => {
            resolve(parseInt(answer));
        });
    });

    const vid = await vidPromise;

    // 提示用户输入 PID
    const pidPromise = new Promise((resolve) => {
        rl.question('请输入设备的 PID (十进制): ', (answer) => {
            resolve(parseInt(answer));
        });
    });

    const pid = await pidPromise;

    // 关闭读取接口
    rl.close();

    // 连接设备
    const device = connectDevice(vid, pid);
    if (device) {
        setupDeviceListeners(device);
        console.log('\n设备已准备就绪，按 Ctrl+C 退出程序');
    } else {
        process.exit(1);
    }
}

// 运行主程序
main().catch(error => {
    console.error('程序运行错误:', error);
    process.exit(1);
});

