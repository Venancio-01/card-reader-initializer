#include <stdio.h>
#include <libusb-1.0/libusb.h>

// 定义目标设备的 Vendor ID 和 Product ID
#define TARGET_VID 0x1234 // 替换为目标设备的 Vendor ID
#define TARGET_PID 0x5678 // 替换为目标设备的 Product ID

// 控制传输请求参数
#define REQUEST_TYPE (LIBUSB_ENDPOINT_OUT | LIBUSB_REQUEST_TYPE_CLASS | LIBUSB_RECIPIENT_INTERFACE)
#define HID_REPORT_SET 0x09
#define HID_RT_OUTPUT 0x02
#define REQUEST 0xC7 // 替换为你的请求码
#define VALUE 0x83CC // 替换为你的值
#define INDEX 0x10	 // 替换为你的索引

int main()
{
	libusb_context *ctx = NULL;
	libusb_device **devs = NULL;
	libusb_device_handle *handle = NULL;
	ssize_t cnt;
	int r;

	// 初始化 libusb
	r = libusb_init(&ctx);
	if (r < 0)
	{
		fprintf(stderr, "Failed to initialize libusb: %s\n", libusb_error_name(r));
		return 1;
	}

	// 获取 USB 设备列表
	cnt = libusb_get_device_list(ctx, &devs);
	if (cnt < 0)
	{
		fprintf(stderr, "Failed to get USB device list\n");
		libusb_exit(ctx);
		return 1;
	}

	// 遍历设备列表并匹配 VID 和 PID
	for (ssize_t i = 0; i < cnt; ++i)
	{
		struct libusb_device_descriptor desc;
		r = libusb_get_device_descriptor(devs[i], &desc);
		if (r < 0)
		{
			fprintf(stderr, "Failed to get device descriptor\n");
			continue;
		}

		if (desc.idVendor == 6790 && desc.idProduct == 57360)
		{
			// 匹配到目标设备，尝试打开设备
			r = libusb_open(devs[i], &handle);
			if (r < 0)
			{
				fprintf(stderr, "Failed to open USB device\n");
				continue;
			}

			libusb_detach_kernel_driver(handle, 0); // detach kernel drive有可能返回0，但是也有可能返回libusb_error_not_found此种错误按libusb规范好像也对
			r = libusb_claim_interface(handle, 0);
			if (r != 0)
			{
				fprintf(stderr, "Failed to claim interface\n");
				libusb_close(handle);
				continue;
			}

			// 打开设备成功，可以在这里进行数据传输等操作
			char buf[32];
			char m_str[5];
			int size, len;
			memset(buf, 0, sizeof(buf));
			memset(m_str, 0, sizeof(m_str));

			m_str[2] = 0x83;
			m_str[3] = 0xCC;
			m_str[4] = 30;
			m_str[0] |= 0x01;
			m_str[1] &= ~0x08;
			m_str[1] |= 0x04;
			m_str[1] |= 0x3;

			m_str[0] = 0xFF;
			m_str[1] |= 0xC0;
			memcpy(&buf[0], m_str, 5);
			size = 32;

			// 通过 USB 控制传输发送数据
			r = libusb_control_transfer(
					handle,							// 设备句柄
					REQUEST_TYPE,				// 请求类型
					HID_REPORT_SET,			// 请求
					HID_RT_OUTPUT << 8, // 值
					0x00,								// 索引
					buf,								// 数据缓冲区
					size,								// 数据大小
					2000								// 超时时间（毫秒）
			);
			if (r < 0)
			{
				fprintf(stderr, "Failed to send control transfer: %s\n", libusb_error_name(r));
			}

			// 释放接口
			r =	libusb_release_interface(handle, 0);
			if (r != 0)
			{
				printf("Failed to release interface: %s\n", libusb_error_name(r));
			}
			r = libusb_attach_kernel_driver(handle, 0);
			if (r != 0)
			{
				printf("Failed to reattach kernel driver: %s\n", libusb_strerror(r));
			}

			// 关闭设备
			libusb_close(handle);

			break; // 找到目标设备后退出循环
		}
	}

	// 释放设备列表和退出 libusb
	libusb_free_device_list(devs, 1);
	libusb_exit(ctx);

	return 0;
}
