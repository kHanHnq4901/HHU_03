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
    console.log('📤 Data gửi:', data);

    await send(store.state.hhu.idConnected, data);

    let timeout: NodeJS.Timeout;

    // Hàm reset timeout mỗi khi có gói tin mới
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.warn('⏱️ Hết thời gian chờ (3s không có gói mới)');
        hookProps.setState((prev) => ({ ...prev, isReading: false }));

        if (hhuReceiveDataListener) {
          hhuReceiveDataListener.remove();
          hhuReceiveDataListener = null;
        }
      }, 3000); // ⏱️ chờ 3s sau gói cuối cùng
    };

    resetTimeout();

    hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic((data: { value: number[] }) => {
      resetTimeout(); // mỗi lần có gói mới -> gia hạn 3s
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


export const hhuHandleReceiveData = (data: { value: number[] }) => {
  console.log('data update for characteristic:', data.value);
  const buf = Buffer.from(data.value);

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
  } else {
    console.log("❌ Header không hợp lệ hoặc dữ liệu quá ngắn", buf[2]);
  }
};
export function responeSetting(payload: number[]) {
  console.log("🔹 Xử lý Setting:", payload);

  if (!payload || payload.length < 3) {
    Alert.alert("Lỗi", "Payload không hợp lệ!");
    return;
  }

  const errorCode = payload[0] as ERROR_TABLE; // u8Res
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

    const packets: number[][] = [];

    // 1️⃣ Gửi lệnh Set Wake Up Time Range (nếu được check)
    if (readTimeRange && timeRange1Start && timeRange1End && timeRange2Start && timeRange2End) {
      const h1 = timeRange1Start.getHours();
      const h2 = timeRange1End.getHours();
      const h3 = timeRange2Start.getHours();
      const h4 = timeRange2End.getHours();

      const payloadString = `${h1},${h2},${h3},${h4}`;
      packets.push(buildSetParamPacket(serial, payloadString));
    }

    // 2️⃣ Gửi lệnh Set Wake Up Specific Days (nếu được check)
    if (readDaysPerMonth && daysPerMonth && daysPerMonth.length > 0) {
      const payloadString = daysPerMonth.join(",");
      packets.push(buildSetParamPacket(serial, payloadString));
    }

    // 3️⃣ Gửi lệnh Set Latch (nếu được check)
    if (readCycle && cycle) {
      const value = parseInt(cycle, 10);
      const payloadString = value.toString();
      packets.push(buildSetParamPacket(serial, payloadString));
    }

    if (packets.length === 0) {
      Alert.alert("Thông báo", "Không có dữ liệu nào để gửi");
      return;
    }

    for (const pkt of packets) {
      console.log("📤 Gửi packet:", pkt);
      await send(store.state.hhu.idConnected, pkt);
    }

    console.log("✅ Đã gửi cấu hình xuống thiết bị");
  } catch (error) {
    console.error("❌ Lỗi khi gửi cấu hình:", error);
    Alert.alert("Lỗi", "Không thể gửi cấu hình");
  }
};





