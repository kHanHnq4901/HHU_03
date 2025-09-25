import { Alert, EventSubscription } from 'react-native';
import { screenDatas } from '../../shared';
import { isValidText, showAlert, showSnack } from '../../util';
import { hookProps } from './controller';
import { checkPeripheralConnection, send } from '../../util/ble';
import { buildGetParamPacket, buildSetParamPacket } from '../../service/hhu/aps/hhuAps';
import { ERROR_MESSAGES, ERROR_TABLE, LoraCommandCode } from '../../service/hhu/defineEM';
import { store } from '../overview/controller';
import BleManager from 'react-native-ble-manager';
let hhuReceiveDataListener: EventSubscription | null = null;
const TAG = 'Handle Config Meter:';
export const readConfig = async () => {
  try {
    if (!hookProps.state.serial || hookProps.state.serial.length !== 10) {
      Alert.alert('Thông báo','Vui lòng điền serial đủ 10 ký tự');
      return;
    }

    const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
    if (!isConnected) return;

    // Reset state + bật trạng thái đang đọc
    hookProps.setState((prev) => ({
      ...prev,
      timeRange1Start: null,
      timeRange1End: null,
      timeRange2Start: null,
      timeRange2End: null,
      cycle: "",
      daysPerMonth: [],
      isReading: true,
    }));

    const { readCycle, readTimeRange, readDaysPerMonth } = hookProps.state;
    const flags = [readCycle, readTimeRange, readDaysPerMonth];
    const trueCount = flags.filter(Boolean).length;

    if (trueCount === 0) {
      Alert.alert('Vui lòng chọn chỉ số cần đọc');
      return;
    }

    let command: number = LoraCommandCode.LORA_CMD_QUERY_DATA_DETAIL;
    if (readCycle && !readTimeRange && !readDaysPerMonth) {
      command = LoraCommandCode.LORA_CMD_PERIOD_LATCH;
    } else if (trueCount >= 2) {
      command = LoraCommandCode.LORA_CMD_SETTING;
    } else if (readDaysPerMonth) {
      command = LoraCommandCode.LORA_CMD_WAKEUP_SPECIFIC_DAYS;
    } else if (readTimeRange) {
      command = LoraCommandCode.LORA_CMD_TIME_WAKEUP;
    }

    const data = buildGetParamPacket(hookProps.state.serial, command);


    await send(store.state.hhu.idConnected, data);
    console.log('📤 Data gửi:', data);
    let timeout: NodeJS.Timeout;

    // Hàm reset timeout mỗi khi có gói tin mới
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        hookProps.setState((prev) => ({ ...prev, isReading: false }));

        if (hhuReceiveDataListener) {
          hhuReceiveDataListener.remove();
          hhuReceiveDataListener = null;
        }

      }, 2000); // ⏱️ chờ 3s sau gói cuối cùng
    };

    resetTimeout();

    hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic((data: { value: number[] }) => {
      hhuHandleReceiveData(data);

    });

  } catch (error) {
    console.error('❌ Lỗi khi đọc cấu hình:', error);
    hookProps.setState((prev) => ({ ...prev, isReading: false }));

    if (hhuReceiveDataListener) {
      hhuReceiveDataListener.remove();
      hhuReceiveDataListener = null;
    }
  }
};

export function parseFotaResponse(data: number[]) {
  console.log("🔹 Data update for characteristic:", data);

  if (data.length < 6) {
    console.warn("⚠️ Payload quá ngắn!");
    return { success: false, message: "Payload không hợp lệ" };
  }

  const buf = Buffer.from(data);

  const start = buf[0];
  const command = buf[1];
  const index = buf[2];
  const response = buf[3];
  const crc = buf.readUInt16LE(4);

  if (start !== 0xAA) {
    console.error("❌ Sai Start byte:", start);
    return { success: false, message: "Sai Start byte" };
  }

  let message = "";
  let success = false;

  switch (response) {
    case 0x00:
      message = "✅ FOTA_RESP_SUCCESS: Thực hiện lệnh thành công.";
      success = true;
      break;
    case 0x01:
      message = "❌ FOTA_RESP_UNKNOWN_CMD: Lệnh không hợp lệ.";
      break;
    case 0x02:
      message = "❌ FOTA_RESP_UNEXPECTED_CMD: Lệnh hợp lệ nhưng sai trình tự.";
      break;
    case 0x03:
      message = "❌ FOTA_RESP_ERR_CRC: CRC firmware thất bại.";
      break;
    case 0x04:
      message = "❌ FOTA_RESP_NEW_FW_TOO_LARGE: Firmware quá lớn.";
      break;
    case 0x05:
      message = "❌ FOTA_RESP_WRITE_FW_ERR: Lỗi ghi flash.";
      break;
    case 0x06:
      message = "❌ FOTA_RESP_ERASE_ERR: Lỗi xóa flash.";
      break;
    case 0x07:
      message = "❌ FOTA_RESP_INDEX_OUT_OF_RANGE: Index vượt phạm vi.";
      break;
    case 0x08:
      message = "❌ FOTA_RESP_ERR_VERSION_TOO_LONG: Chuỗi version quá dài.";
      break;
    default:
      message = `⚠️ Unknown response code: ${response}`;
  }

  console.log(`📡 FOTA Response | Cmd: ${command}, Index: ${index}, CRC: ${crc}`);
  console.log(message);

  return { success, code: response, message, command, index, crc };
}

export const hhuHandleReceiveData = (data: { value: number[] }) => {
  console.log('data update for characteristic:', data.value);
  const buf = Buffer.from(data.value);
  if (buf[0] === 0xAA){
    parseFotaResponse(data.value)
  }
  if (buf.length >= 15 && buf[0] === 0x02 && buf[1] === 0x08) { // kiểm tra tối thiểu
    console.log("✅ Header hợp lệ");

    const moduleType = buf[1];
    const commandType = buf[2];
    const lenPayload = buf[3];
    const meterSerialBytes = buf.slice(4, 14); // 10 byte meter serial
    const meterSerial = meterSerialBytes.toString('ascii'); // nếu là string ASCII

    const payloadStart = 14;
    const payloadEnd = payloadStart + lenPayload;
    const payload = Array.from(buf.slice(payloadStart, payloadEnd)); // chỉ lấy payload

    console.log("📡 Meter Serial:", meterSerial);
    console.log("📦 Payload:", payload);
    if (hookProps.state.serial && meterSerial !== hookProps.state.serial) {
      console.warn(
        `⚠️ Bỏ qua dữ liệu của meterSerial=${meterSerial} vì đang đọc meterSerial=${hookProps.state.serial}`
      );
      return;
    }
    switch (commandType) {
      case 0x03:
        responeSetting(payload);
        break;
      default:
        console.log("⚠️ Unknown type:", commandType, payload);
    }
  } 
};
export function responeSetting(payload: number[]) {
  console.log("🔹 Xử lý Setting:", payload);

  if (!payload || payload.length < 3) {
    Alert.alert("Lỗi", "Payload không hợp lệ!");
    return;
  }

  const errorCode = payload[0] as ERROR_TABLE; // u8Respone
  const command = payload[1]; // u8CommandCode
  const paramCount = payload[2]; // u8ParamCount

  if (errorCode !== ERROR_TABLE.E_SUCCESS) {
    const message = ERROR_MESSAGES[errorCode] || "Lỗi không xác định";
    Alert.alert("❌ Lỗi", message);
    return;
  }

  console.log(`✅ Thành công - Command=${command}, ParamCount=${paramCount}`);

  let offset = 3; // bắt đầu đọc LoraParamSettingType từ byte thứ 3
  for (let i = 0; i < paramCount; i++) {
    if (offset + 2 > payload.length) {
      console.warn("⚠️ Payload thiếu dữ liệu cho param", i);
      break;
    }

    const paramId = payload[offset];
    const lenParam = payload[offset + 1];
    const paramData = payload.slice(offset + 2, offset + 2 + lenParam);

    console.log(
      `📌 Param ${i + 1}: paramId=${paramId}, len=${lenParam}, data=`,
      paramData
    );

    applySetting(paramId, paramData);
    offset += 2 + lenParam;
  }

  if (offset < payload.length) {
    console.log("ℹ️ Còn dư dữ liệu trong payload:", payload.slice(offset));
  }
  hookProps.setState((prev) => ({ ...prev, isReading: false }));
}
function applySetting(paramId: number, paramData: number[]) {
  switch (paramId) {
    case 0x00: // LORA_WAKEUP_TIME (4 byte: [cycle, h1, h2, h3] tuỳ định nghĩa)
      if (paramData.length === 4) {
        const hour1 = paramData[0];
        const hour2 = paramData[1];
        const hour3 = paramData[2];
        const hour4 = paramData[3];

        hookProps.setState(prev => ({
          ...prev,
          timeRange1Start:new Date(2025, 0, 1, hour1, 0),
          timeRange1End: new Date(2025, 0, 1, hour2, 0),
          timeRange2Start: new Date(2025, 0, 1, hour3, 0),
          timeRange2End: new Date(2025, 0, 1, hour4, 0),
        }));
      }
      break;

    case 0x01: // LORA_WAKEUP_SPECIFIC_DAYS_ID (7 byte: danh sách ngày trong tháng)
      if (paramData.length === 7) {
        hookProps.setState(prev => ({
          ...prev,
          daysPerMonth: paramData, // array [d1, d2, ... d7]
        }));
      }
      break;

      case 0x02: // LORA_PERIOD_LATCH_ID (2 byte uint16_t)
      if (paramData.length === 2) {
        // Little-endian
        const value = (paramData[0] & 0xff) | ((paramData[1] & 0xff) << 8);
    
        hookProps.setState(prev => ({
          ...prev,
          cycle: value.toString(), // ✅ ép sang string
        }));
    
        console.log("🔄 LORA_PERIOD_LATCH_ID:", value);
      }
      break;
  }
}
let configTimeout: NodeJS.Timeout | null = null;
let hasConfigResponse = false; // ⚡️ thêm cờ

export const writeConfig = async () => {
  try {
    if (!hookProps.state.serial || hookProps.state.serial.length !== 10) {
      Alert.alert("Thông báo", "Vui lòng điền serial đủ 10 ký tự");
      return;
    }

    const serial = hookProps.state.serial;
    const {
      timeRange1Start,
      timeRange1End,
      timeRange2Start,
      timeRange2End,
      daysPerMonth,
      cycle,
      readCycle,
      readTimeRange,
      readDaysPerMonth,
    } = hookProps.state;

    const params: { id: number; data: number[] }[] = [];

    // 1️⃣ WakeUp Time
    if (readTimeRange && timeRange1Start && timeRange1End && timeRange2Start && timeRange2End) {
      const data = [
        timeRange1Start.getHours(),
        timeRange1End.getHours(),
        timeRange2Start.getHours(),
        timeRange2End.getHours(),
      ];
      params.push({ id: 0x00, data });
    }

    // 2️⃣ WakeUp Specific Days
    if (readDaysPerMonth && daysPerMonth?.length > 0) {
      let days = daysPerMonth.map(Number);
      if (days.length < 7) {
        days = [...days, ...Array(7 - days.length).fill(0)];
      } else if (days.length > 7) {
        days = days.slice(0, 7);
      }
      params.push({ id: 0x01, data: days });
    }

    // 3️⃣ Period Latch
    if (readCycle && cycle) {
      const value = parseInt(cycle, 10);
      params.push({
        id: 0x02,
        data: [value & 0xff, (value >> 8) & 0xff],
      });
    }

    if (params.length === 0) {
      Alert.alert("Thông báo", "Không có dữ liệu nào để gửi");
      return;
    }

    const packet = buildSetParamPacket(serial, params);

    hookProps.setState((prev) => ({
      ...prev,
      isReading: true,
      textLoading: "Đang gửi cấu hình...",
    }));

    hasConfigResponse = false; // reset cờ mỗi lần gửi mới

    console.log("📤 Gửi packet gộp:", packet);


    if (hhuReceiveDataListener) {
      hhuReceiveDataListener.remove();
      hhuReceiveDataListener = null;
    }
    hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic((data: { value: number[] }) => {
      hhuResponeConfig(data);
    });
    await send(store.state.hhu.idConnected, packet);
    if (configTimeout) clearTimeout(configTimeout);
    configTimeout = setTimeout(() => {
      if (!hasConfigResponse) { // ✅ chỉ xử lý khi chưa có phản hồi
        hookProps.setState((prev) => ({
          ...prev,
          isReading: false,
          textLoading: "",
        }));
        if (hhuReceiveDataListener) {
          hhuReceiveDataListener.remove();
          hhuReceiveDataListener = null;
        }
        Alert.alert("Thông báo", "❌ Cấu hình thất bại (timeout)");
      }
    }, 5000);

  } catch (error) {
    console.error("❌ Lỗi khi gửi cấu hình:", error);
    hookProps.setState((prev) => ({ ...prev, isReading: false, textLoading: "" }));
    Alert.alert("Lỗi", "Không thể gửi cấu hình");
  }
};

export const hhuResponeConfig = (data: { value: number[] }) => {
  console.log("📩 Nhận phản hồi từ thiết bị:", data.value);
  const buf = Buffer.from(data.value);

  if (buf.length >= 15 && buf[0] === 0x02 && buf[1] === 0x08) {
    console.log("✅ Header hợp lệ");

    const commandType = buf[2];
    const lenPayload = buf[3];
    const meterSerial = buf.slice(4, 14).toString("ascii");

    if (hookProps.state.serial && meterSerial !== hookProps.state.serial) {
      console.warn(`⚠️ Bỏ qua dữ liệu của meterSerial=${meterSerial}`);
      return;
    }

    const payload = Array.from(buf.slice(14, 14 + lenPayload));
    console.log("📡 Meter Serial:", meterSerial);
    console.log("📦 Payload:", payload);

    switch (commandType) {
      case 0x02:
        const result = responeSetConfig(payload);

        if (configTimeout) {
          clearTimeout(configTimeout);
          configTimeout = null;
        }

        if (hhuReceiveDataListener) {
          hhuReceiveDataListener.remove();
          hhuReceiveDataListener = null;
        }

        if (result.success) {
          Alert.alert("Thông báo", `✅ Cài đặt thành công (${result.count} trường)`);
          hookProps.setState((prev) => ({ ...prev, isReading: false }));
        } else {
          Alert.alert("Thông báo", `❌ Cài đặt thất bại: ${result.error}`);
          hookProps.setState((prev) => ({ ...prev, isReading: false }));
        }
        break;

      default:
        console.log("⚠️ Unknown type:", commandType, payload);
    }
  } else {
    console.log("❌ Header không hợp lệ hoặc dữ liệu quá ngắn", buf);
  }
};

const ERROR_CODES: Record<number, string> = {
  0: "Thành công",
  1: "Không xử lý",
  2: "Tham số không hợp lệ",
  3: "Hết thời gian chờ",
  4: "Hết bộ nhớ",
  5: "Lỗi SPI",
  6: "CSDL rỗng",
  7: "CSDL hết bộ nhớ",
  8: "Định dạng không hợp lệ",
  9: "Lỗi RTC",
  10: "Lệnh không hợp lệ",
  11: "Mã lệnh không hợp lệ",
  12: "Sai CRC",
  13: "Từ chối quyền",
  14: "Null pointer",
  15: "Lỗi truyền dữ liệu",
  16: "Chiều dài quá ngắn",
  17: "Lỗi mã hóa",
  18: "Lỗi không xác định",
};

export function responeSetConfig(payload: number[]) {
  console.log("🔹 Xử lý phản hồi Setting:", payload);

  if (payload.length < 3) {
    console.warn("⚠️ Payload không hợp lệ");
    return { success: false, count: 0, error: "Payload không hợp lệ" };
  }

  const u8Res = payload[0];         // Mã kết quả
  const u8CommandCode = payload[1]; // Mã lệnh
  const u8ParamCount = payload[2];  // Số trường set thành công

  const errorMsg = ERROR_CODES[u8Res] || `Mã lỗi không xác định (${u8Res})`;

  if (u8Res === 0) {
    return { success: true, count: u8ParamCount, command: u8CommandCode, error: null };
  } else {
    return { success: false, count: 0, command: u8CommandCode, error: errorMsg };
  }
}






