import {
  ObjSend,
  readVersion,
  resetBoard,
  setNameHHU,
  TYPE_HHU_CMD,
} from '../../service/hhu/hhuFunc';
import { hookProps, setStatus, store, variable } from './controller';

import {
  checkUpdateHHU,
  getStringFirmware,
  getVersion,
} from '../../service/api';
import { checkPeripheralConnection, send, sendHHU } from '../../util/ble';
import { Alert, EventSubscription } from 'react-native';
import { BootloaderCommandCode, buildCmdBootloaderPacket, buildCmdHuPacket, buildQueryDataPacket, HuCommandCode } from '../../service/hhu/aps/hhuAps';
import BleManager from 'react-native-ble-manager';
import { BleFunc_TryConnectToLatest, KEY_STORAGE } from '../../service/hhu/bleHhuFunc';
import AsyncStorage from '@react-native-community/async-storage';
import { SetProgressBar } from '../../service/boardRF/bootloader';
import { crc16 } from '../../util/crc16';
import { crc32Stm32 } from '../../util/crc32';
let hhuReceiveDataListener: EventSubscription | null = null;
const TAG = 'handle Btn boardBLE:';
enum HuResponseCode {
  CMD_RESP_SUCCESS = 0x00,
  CMD_RESP_CRC_FAIL = 0x01,
  CMD_RESP_INVALID_COMMAND = 0x02,
  CMD_RESP_TRANS_LORA_FAIL = 0x03,
  CMD_RESP_OPTICAL_DISCONNECT = 0x04,
  CMD_RESP_OPTICAL_NOT_READY = 0x05,
  CMD_RESP_OPTICAL_BUSY = 0x06,
  CMD_RESP_OPTICAL_INCORRECT_DEVICE = 0x07,
  CMD_RESP_NAME_TOO_LONG = 0x08,
}
const HuResponseMsg: Record<number, string> = {
  [HuResponseCode.CMD_RESP_SUCCESS]: "Thành công",
  [HuResponseCode.CMD_RESP_CRC_FAIL]: "Mã CRC không chính xác",
  [HuResponseCode.CMD_RESP_INVALID_COMMAND]: "Lệnh gửi xuống không hợp lệ",
  [HuResponseCode.CMD_RESP_TRANS_LORA_FAIL]: "Truyền dữ liệu qua LORA thất bại",
  [HuResponseCode.CMD_RESP_OPTICAL_DISCONNECT]: "Cổng quang chưa được kết nối",
  [HuResponseCode.CMD_RESP_OPTICAL_NOT_READY]: "Cổng quang chưa sẵn sàng nhận dữ liệu (đang cấu hình)",
  [HuResponseCode.CMD_RESP_OPTICAL_BUSY]: "Cổng quang đang bận",
  [HuResponseCode.CMD_RESP_OPTICAL_INCORRECT_DEVICE]: "Cổng USB phát hiện không đúng loại thiết bị",
  [HuResponseCode.CMD_RESP_NAME_TOO_LONG]: "Tên đặt cho BLE quá dài",
};

export const onReadVersionBtnPress = async () => {
  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return;
  hookProps.setState((prev) => ({
    ...prev,
    status: `Đang đọc`,
  }));
  // 🚮 clear listener cũ
  if (hhuReceiveDataListener) {
    hhuReceiveDataListener.remove();
    hhuReceiveDataListener = null;
  }

  // Đăng ký listener mới
  hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
    (data: { value: number[] }) => {
      handleHuResponse(data.value);
      if (hhuReceiveDataListener) {
        hhuReceiveDataListener.remove();
        hhuReceiveDataListener = null;
      }
    }
  );

  // Build packet lấy version
  const requestData = buildCmdHuPacket(HuCommandCode.CMD_APP_GET_VERSION_FIRMWARE, [0x01]);

  try {
    await sendHHU(store.state.hhu.idConnected, requestData);
    console.log("🚀 Gửi lệnh đọc version firmware:", requestData);
  } catch (err) {
    console.error("❌ Lỗi khi gửi lệnh:", err);
  }
};


enum FotaResponseCode {
  FOTA_RESP_SUCCESS = 0x00,
  FOTA_RESP_UNKNOWN_CMD = 0x01,
  FOTA_RESP_UNEXPECTED_CMD = 0x02,
  FOTA_RESP_ERR_CRC = 0x03,
  FOTA_RESP_NEW_FW_TOO_LARGE = 0x04,
  FOTA_RESP_WRITE_FW_ERR = 0x05,
  FOTA_RESP_ERASE_ERR = 0x06,
  FOTA_RESP_INDEX_OUT_OF_RANGE = 0x07,
  FOTA_RESP_ERR_VERSION_TOO_LONG = 0x08,
}

// Bản đồ Response → thông điệp
const FotaResponseMsg: Record<number, string> = {
  [FotaResponseCode.FOTA_RESP_SUCCESS]: "Thực hiện lệnh thành công",
  [FotaResponseCode.FOTA_RESP_UNKNOWN_CMD]: "Nhận lệnh không hợp lệ",
  [FotaResponseCode.FOTA_RESP_UNEXPECTED_CMD]: "Lệnh hợp lệ nhưng sai trình tự",
  [FotaResponseCode.FOTA_RESP_ERR_CRC]: "Kiểm tra CRC của firmware thất bại",
  [FotaResponseCode.FOTA_RESP_NEW_FW_TOO_LARGE]: "Firmware mới vượt quá dung lượng flash",
  [FotaResponseCode.FOTA_RESP_WRITE_FW_ERR]: "Lỗi khi ghi firmware xuống flash",
  [FotaResponseCode.FOTA_RESP_ERASE_ERR]: "Lỗi khi xóa flash",
  [FotaResponseCode.FOTA_RESP_INDEX_OUT_OF_RANGE]: "Index frame vượt phạm vi cho phép",
  [FotaResponseCode.FOTA_RESP_ERR_VERSION_TOO_LONG]: "Chuỗi version FW quá dài",
};

export async function handleHuBootloaderUpdateResponse(
  bytes: number[],
): Promise<boolean> {
  try {
    console.log("bytes:", bytes);

    const start = bytes[0];
    if (start !== 0xaa) {
      console.warn("⚠️ Sai Start byte:", start);
      return false;
    }
    const response = bytes[2];


    const respMsg =
      FotaResponseMsg[response] ??
      `Mã lỗi không xác định (0x${response.toString(16)})`;

    if (response === FotaResponseCode.FOTA_RESP_SUCCESS) {
      hookProps.setState((s) => ({ ...s, status: respMsg }));
      return true;
    } else {
      hookProps.setState((s) => ({ ...s, status: respMsg }));
      return false;
    }
  } catch (err) {
    console.error("❌ Lỗi trong handleHuBootloaderUpdateResponse:", err);
    return false;
  }
}
variable.onDismiss = () => {
  hookProps.setState(state => {
    state.showModalSetName = false;
    return { ...state };
  });
};
variable.onOkChangeName = async (text: string) => {
  hookProps.setState(state => {
    state.showModalSetName = false;
    state.nameHHU = text;
    return { ...state };
  });
  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return;

  // 🚮 clear listener cũ
  if (hhuReceiveDataListener) {
    hhuReceiveDataListener.remove();
    hhuReceiveDataListener = null;
  }

  // Đăng ký listener mới
  hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
    (data: { value: number[] }) => {
      handleHuResponse(data.value,store.state.hhu.idConnected);
      if (hhuReceiveDataListener) {
        hhuReceiveDataListener.remove();
        hhuReceiveDataListener = null;
      }
    }
  );

  // Build packet lấy version
  const nameBytes = Array.from(Buffer.from(text, 'utf-8')); // hoặc ascii nếu yêu cầu
  const requestData = buildCmdHuPacket(HuCommandCode.CMD_APP_CHANGE_NAME_BLE, nameBytes);

  try {
    await sendHHU(store.state.hhu.idConnected, requestData);
    console.log("🚀 Gửi lệnh đọc change name ble", requestData);
  } catch (err) {
    console.error("❌ Lỗi khi gửi lệnh:", err);
  }
}

export const onCheckUpdateBtnPress = async () => {
  if (hookProps.state.isBusy === true) {
    return;
  }
  hookProps.setState(state => {
    state.isBusy = true;
    state.status = 'Đang kiểm tra update ...';

    return { ...state };
  });
  let status: string = '';
  const response = await getVersion();
  console.log('response:', response);
  if (response.bResult === true) {
    status =
      'Version: ' +
      response.version +
      ' Ngày phát hành: ' +
      response.dateIssue +
      (response.priority === 'Bình thường'
        ? ''
        : '.\nMức độ: ' + response.priority);
    checkUpdateHHU(response, true);
  } else {
    status = response.message;
  }
  hookProps.setState(state => {
    state.isBusy = false;
    state.status = status;

    return { ...state };
  });
};
export async function ondUpdateFirmwareBtnPress(reset: boolean = true) {
  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return;

  hookProps.setState((prev) => ({
    ...prev,
    status: "📡 Gửi lệnh vào Bootloader...",
    isBusy: true,
    isUpdatingFirmware: true,
    progressUpdate: 0,
    showProgress: true,
  }));

  // hủy listener cũ
  if (hhuReceiveDataListener) {
    hhuReceiveDataListener.remove();
    hhuReceiveDataListener = null;
  }

  const requestData = buildCmdHuPacket(
    HuCommandCode.CMD_APP_UPDATE_FIRMWARE,
    [0x00]
  );

  // nghe phản hồi CMD_APP_UPDATE_FIRMWARE trước khi gửi
  hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
    async (data: { value: number[] }) => {
      await handleHuUpdateResponse(data.value); // nếu success thì sẽ gọi tiếp bước 2
    }
  );

  try {
    await sendHHU(store.state.hhu.idConnected, requestData);
    console.log("🚀 Gửi CMD_APP_UPDATE_FIRMWARE:", requestData);
  } catch (err) {
    console.error("❌ Lỗi khi gửi CMD_APP_UPDATE_FIRMWARE:", err);
    hookProps.setState((s) => ({
      ...s,
      isBusy: false,
      status: "❌ Lỗi khi gửi CMD_APP_UPDATE_FIRMWARE",
      isUpdatingFirmware: false,
    }));
  }
}
async function handleHuUpdateResponse(bytes: number[]) {
  try {
    console.log("bytes:", bytes);

    const start = bytes[0];
    if (start !== 0xAA) {
      console.warn("⚠️ Sai byte Start:", start);
      return;
    }

    const command = bytes[1];
    const commandResp = bytes[2];
    const length = bytes[3];
    const payload = bytes.slice(4, 4 + length);

    console.log("ℹ️ Nhận phản hồi:", { command, commandResp, payload });

    const respMsg =
      HuResponseMsg[commandResp] ??
      `Mã lỗi không xác định (0x${commandResp.toString(16)})`;

    if (commandResp !== HuResponseCode.CMD_RESP_SUCCESS) {
      hookProps.setState((s) => ({ ...s, status: `❌ ${respMsg}` }));
      return;
    }

    switch (command) {
      case HuCommandCode.CMD_APP_UPDATE_FIRMWARE: {
        // MCU báo đã vào bootloader
        hookProps.setState((s) => ({
          ...s,
          status: `${respMsg}: MCU đã vào Bootloader`,
        }));

        // B2.1: lấy firmware
        const retApi = await getStringFirmware();
        if (!retApi.bResult || !retApi.strFirmware) {
          hookProps.setState((s) => ({
            ...s,
            isBusy: false,
            status: "❌ Không lấy được firmware",
            isUpdatingFirmware: false,
          }));
          return;
        }

        const buf = Buffer.from(retApi.strFirmware, "hex");
        const fwLength = buf.length;
        console.log(`📦 Firmware size = ${fwLength} bytes`);

        // B2.2: gửi START_UPDATE với size
        const payload: number[] = [fwLength & 0xff, (fwLength >> 8) & 0xff];
        const requestData = buildCmdBootloaderPacket(
          BootloaderCommandCode.FOTA_CMD_START_UPDATE,
          payload
        );

        const bResult: boolean = await new Promise((resolve) => {
          // nghe phản hồi FOTA_CMD_START_UPDATE
          if (hhuReceiveDataListener) {
            hhuReceiveDataListener.remove();
            hhuReceiveDataListener = null;
          }

          hhuReceiveDataListener =
            BleManager.onDidUpdateValueForCharacteristic(
              async (data: { value: number[] }) => {
                const ok = await handleHuBootloaderUpdateResponse(data.value);
                if (hhuReceiveDataListener) {
                  hhuReceiveDataListener.remove();
                  hhuReceiveDataListener = null;
                }
                resolve(ok);
              }
            );

          sendHHU(store.state.hhu.idConnected, requestData).catch((err) => {
            console.error("❌ Lỗi khi gửi START_UPDATE:", err);
            if (hhuReceiveDataListener) {
              hhuReceiveDataListener.remove();
              hhuReceiveDataListener = null;
            }
            resolve(false);
          });
        });

        if (!bResult) {
          hookProps.setState((s) => ({
            ...s,
            isBusy: false,
            status: "❌ START_UPDATE thất bại",
            isUpdatingFirmware: false,
          }));
          return;
        }

        // B3: Gửi firmware
        hookProps.setState((s) => ({ ...s, status: "📤 Đang gửi Firmware..." }));
        const flashOk = await SendFlashPage(retApi.strFirmware);

        if (!flashOk) {
          hookProps.setState((s) => ({
            ...s,
            isBusy: false,
            isUpdatingFirmware: false,
            status: "❌ Nạp Firmware thất bại",
          }));
          return;
        }

        // B4: CRC check
        const fwBytes = new Uint8Array(buf);
        const crc32 = crc32Stm32(fwBytes);

        console.log("📌 CRC32 firmware =", crc32.toString(16));

        // payload CRC 4 byte (Little Endian)
        const payloadCrc = [
          crc32 & 0xff,
          (crc32 >> 8) & 0xff,
          (crc32 >> 16) & 0xff,
          (crc32 >> 24) & 0xff,
        ];

        const crcRequest = buildCmdBootloaderPacket(
          BootloaderCommandCode.FOTA_CMD_CHECK_CRC_FW, // 0x12
          payloadCrc
        );

        const crcOk: boolean = await new Promise((resolve) => {
          if (hhuReceiveDataListener) {
            hhuReceiveDataListener.remove();
            hhuReceiveDataListener = null;
          }

          hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
            async (data: { value: number[] }) => {
              const ok = await handleHuBootloaderUpdateResponse(data.value);
              if (hhuReceiveDataListener) {
                hhuReceiveDataListener.remove();
                hhuReceiveDataListener = null;
              }
              resolve(ok);
            }
          );

          sendHHU(store.state.hhu.idConnected, crcRequest).catch((err) => {
            console.error("❌ Lỗi gửi CRC:", err);
            if (hhuReceiveDataListener) {
              hhuReceiveDataListener.remove();
              hhuReceiveDataListener = null;
            }
            resolve(false);
          });
        });

        if (!crcOk) {
          hookProps.setState((s) => ({
            ...s,
            status: "❌ CRC check thất bại",
          }));
          return;
        }

        // B5: Gửi version FW mới
        const versionResp = await getVersion();
        if (!versionResp || !versionResp.version) {
          hookProps.setState((s) => ({
            ...s,
            status: "❌ Không lấy được version FW",
          }));
          return;
        }

        const versionStr = versionResp.version;
        const versionBytes = Array.from(new TextEncoder().encode(versionStr));

        const versionRequest = buildCmdBootloaderPacket(
          BootloaderCommandCode.FOTA_CMD_VERSION_FW, // 0x13
          versionBytes
        );

        const versionOk: boolean = await new Promise((resolve) => {
          if (hhuReceiveDataListener) {
            hhuReceiveDataListener.remove();
            hhuReceiveDataListener = null;
          }

          hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
            async (data: { value: number[] }) => {
              const ok = await handleHuBootloaderUpdateResponse(data.value);
              if (hhuReceiveDataListener) {
                hhuReceiveDataListener.remove();
                hhuReceiveDataListener = null;
              }
              resolve(ok);
            }
          );

          sendHHU(store.state.hhu.idConnected, versionRequest).catch((err) => {
            console.error("❌ Lỗi gửi Version FW:", err);
            if (hhuReceiveDataListener) {
              hhuReceiveDataListener.remove();
              hhuReceiveDataListener = null;
            }
            resolve(false);
          });
        });

        if (versionOk) {
          hookProps.setState((s) => ({
            ...s,
            isBusy: false,
            isUpdatingFirmware: false,
            status: `✅ Update FW thành công - Version mới: ${versionStr}`,
          }));
          ObjSend.isNeedUpdate = false;
        } else {
          hookProps.setState((s) => ({
            ...s,
            status: "❌ Gửi version FW thất bại",
          }));
        }

        break;
      }

      default:
        console.warn("⚠️ Command chưa xử lý:", command);
        break;
    }
  } catch (err) {
    console.error("❌ Lỗi trong handleHuResponse:", err);
  }
}

export const SendFlashPage = async (firmwareStr: string ): Promise<boolean> => {
  const pageSize = 128; // tối đa 128 byte/payload
  const buf = Buffer.from(firmwareStr, "hex");
  const totalSize = buf.length;
  const totalPage = Math.ceil(totalSize / pageSize);
  const maxRetries = 3;

  for (let page = 0; page < totalPage; page++) {
    const command = BootloaderCommandCode.FOTA_CMD_RECV_FW;

    const offset = page * pageSize;
    const chunk = buf.slice(offset, offset + pageSize);
    const length = chunk.length;

    // Build frame theo format
    const frame: number[] = [];
    frame.push(0xaa); // Start
    frame.push(command); // Command
    frame.push(page & 0xff, (page >> 8) & 0xff); // Index (2 byte)
    frame.push(length & 0xff); // Length Payload (1 byte)
    frame.push(...chunk); // Payload

    // CRC16 trên toàn bộ frame hiện tại
    const crc = crc16(Buffer.from(frame), frame.length);
    frame.push(crc & 0xff, (crc >> 8) & 0xff);

    let success = false;

    for (let retry = 0; retry < maxRetries; retry++) {
      console.log(`📤 Chuẩn bị gửi gói ${page + 1}/${totalPage}, thử lần ${retry + 1}`);

      const ok = await new Promise<boolean>((resolve) => {
        // 1️⃣ Đăng ký listener trước khi gửi
        const listener = BleManager.onDidUpdateValueForCharacteristic(
          (data: { value: number[] }) => {
            try {
              const resp = data.value;
              console.log("📥 Nhận response raw:", resp.map(b => b.toString(16).padStart(2, "0")).join(" "));
      
              if (resp.length >= 8 && resp[0] === 0xaa && resp[1] === command) {
                const respIndex = resp[4] | (resp[5] << 8);
                console.log(`📥 Phân tích response -> command: 0x${resp[1].toString(16)}, respIndex: ${respIndex}, status: 0x${resp[2].toString(16)}`);
      
                if (respIndex === page && resp[2] === 0x00) {
                  // 0x01 = OK
                  listener.remove();
                  resolve(true);
                  return;
                }
              }
      
              listener.remove();
              resolve(false);
            } catch (err) {
              console.error("❌ Lỗi khi xử lý response:", err);
              listener.remove();
              resolve(false);
            }
          }
        );
      
        // 2️⃣ Sau đó mới gửi frame
        console.log("📤 Gửi frame:", frame.map(b => b.toString(16).padStart(2, "0")).join(" "));
      
        sendHHU(store.state.hhu.idConnected, frame).catch((err) => {
          console.error("❌ Lỗi khi gửi:", err);
          listener.remove();
          resolve(false);
        });
      });
      

      if (ok) {
        success = true;
        SetProgressBar((page + 1) / totalPage);
        break;
      } else {
        console.warn(`⚠️ Gói ${page} gửi lỗi, thử lại...`);
      }
    }

    if (!success) {
      console.error(`❌ Thất bại ở gói ${page}`);
      return false;
    }
    await new Promise((r) => setTimeout(r, 10));
  }

  console.log("✅ Gửi toàn bộ firmware thành công!");
  return true;
};


async function handleHuResponse(bytes: number[],idPeripheral?: string) {
  try {
    console.log('bytes:', bytes);

    const start = bytes[0];
    if (start !== 0xAA) {
      console.warn("⚠️ Sai byte Start:", start);
      return;
    }

    const command = bytes[1];       
    const commandResp = bytes[2];  
    const length = bytes[3];        
    const payload = bytes.slice(4, 4 + length);

    console.log("ℹ️ Nhận phản hồi:", { command, commandResp, payload });

    const respMsg = HuResponseMsg[commandResp] 
      ?? `Mã lỗi không xác định (0x${commandResp.toString(16)})`;

    if (commandResp !== HuResponseCode.CMD_RESP_SUCCESS) {
      hookProps.setState((s) => ({ ...s, status: `${respMsg}` }));
      return;
    }

    console.log("👉 Vào switch với command:", command);

    switch (command) {
      case HuCommandCode.CMD_APP_GET_VERSION_FIRMWARE: {
        const versionStr = String.fromCharCode(...payload);
        hookProps.setState((s) => ({ ...s, status: `${respMsg}: ${versionStr}` }));
        break;
      }
      case HuCommandCode.CMD_APP_CHANGE_NAME_BLE: {
          console.log("✅ Đổi tên thiết bị thành:", hookProps.state.nameHHU);

          hookProps.setState((s) => ({ 
            ...s, 
            status: `${respMsg}: Đổi tên thiết bị thành ${hookProps.state.nameHHU}` 
          }));
        break;
      }

      case HuCommandCode.CMD_APP_UPDATE_FIRMWARE: {
        hookProps.setState((s) => ({ ...s, status: `${respMsg}: Đang cập nhật firmware...` }));
        ondUpdateFirmwareBtnPress();
        break;
      }

      default:
        hookProps.setState((s) => ({ 
          ...s, 
          status: `${respMsg} (Command 0x${command.toString(16)})` 
        }));
        console.warn("⚠️ Command chưa xử lý:", command);
        break;
    }
  } catch (err) {
    console.error("❌ Lỗi trong handleHuResponse:", err);
  }
}

