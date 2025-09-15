import { Alert, EventSubscription } from "react-native";
import { hookProps } from "./controller";
import { LoraCommandCode } from "../../service/hhu/defineEM";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { store } from "../overview/controller";
import { checkPeripheralConnection, send } from "../../util/ble";
import { insertMeterData } from "../../database/repository";
import BleManager from 'react-native-ble-manager';
import { parseDate, parseUint16, parseUint32 } from "../../util";
let hhuReceiveDataListener: EventSubscription | null = null;
export const onReadData = async () => {
  try {
    if (!hookProps.state.serial) {
      Alert.alert('Vui lòng điền serial');
      return;
    }

    const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
    if (!isConnected) return;

    hookProps.setState((prev) => ({ ...prev, isReading: true, meterData: null ,historyData : null}));

    const data = buildQueryDataPacket(hookProps.state.serial, hookProps.state.isDetailedRead);
    console.log('📤 Data gửi:', data);

    await send(store.state.hhu.idConnected, data);

    let timeout: NodeJS.Timeout;

    // Hàm reset timeout mỗi lần có dữ liệu
    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.warn('⏱️ Hết thời gian chờ phản hồi!');
        hookProps.setState((prev) => ({ ...prev, isReading: false }));

        if (hhuReceiveDataListener) {
          hhuReceiveDataListener.remove();
          hhuReceiveDataListener = null;
        }

      }, 5000);
    };

    resetTimeout(); 

    hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic((data: { value: number[]; }) => {
      resetTimeout(); 
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


export let hhuHandleReceiveData = (data: { value: number[] }) => {
  console.log('data update for characteristic:', data.value);
  const buf = Buffer.from(data.value);

  if (buf.length >= 15 && buf[0] === 0x02 && buf[1] === 0x08) { // kiểm tra tối thiểu
    console.log("✅ Header hợp lệ");

    const moduleType = buf[1];
    const commandType = buf[2];
    const lenPayload = buf[3];
    const meterSerialBytes = buf.slice(4, 14); // 10 byte meter serial
    const meterSerial = meterSerialBytes.toString('ascii'); // nếu là string ASCII

    // ✅ Kiểm tra meterSerial có khớp với serial đang đọc
    if (hookProps.state.serial && meterSerial !== hookProps.state.serial) {
      console.warn(
        `⚠️ Bỏ qua dữ liệu của meterSerial=${meterSerial} vì đang đọc meterSerial=${hookProps.state.serial}`
      );
      return;
    }

    const payloadStart = 14;
    const payloadEnd = payloadStart + lenPayload;
    const payload = Array.from(buf.slice(payloadStart, payloadEnd)); // chỉ lấy payload

    console.log("📡 Meter Serial:", meterSerial);
    console.log("📦 Payload:", payload);

    switch (commandType) {
      case 0x01:
        responeData(payload, meterSerial);
        break;

      default:
        console.log("⚠️ Unknown type:", commandType, payload);
    }

  } else {
    console.log("❌ Header không hợp lệ hoặc dữ liệu quá ngắn", buf[2]);
  }
};



export function responeData(payload: number[], meterSerial: string) {
  if (payload.length < 3) {
    console.warn("⚠️ Payload quá ngắn:", payload);
    return;
  }

  const u8CommandCode = payload[0];
  const indexPacket = payload[1];
  const recordCount = payload[2];
  console.log(`📥 Nhận gói index=${indexPacket}, recordCount=${recordCount}, cmd=${u8CommandCode}`);

  const bytePerRecord = u8CommandCode === 1 ? 4 : 2;
  let offset = 3;

  let currentTime = "";
  let impData = 0;
  let expData = 0;
  let event = "";
  let batteryLevel = "";
  let latchPeriodMinutes = 0;

  // ✅ Gói đầu tiên → parse header
  if (indexPacket === 1) {
    currentTime = parseDate(payload.slice(offset, offset + 6));
    offset += 6;

    impData = parseUint32(payload.slice(offset, offset + 4));
    offset += 4;

    expData = parseUint32(payload.slice(offset, offset + 4));
    offset += 4;

    event = payload[offset].toString(16).padStart(2, "0");
    offset += 1;

    const voltage = payload[offset] / 10;
    batteryLevel = `${Math.min(100, Math.max(0, (voltage / 3.6) * 100)).toFixed(0)}%`;
    offset += 1;

    latchPeriodMinutes = (payload[offset] & 0xff) | ((payload[offset + 1] & 0xff) << 8);
    offset += 2;
  }

  // ✅ Lấy baseTime từ historyData
  const prevHistory = hookProps.state.historyData;
  let baseTime: Date;

  if (indexPacket === 1 || !prevHistory) {
    baseTime = new Date(currentTime);
  } else {
    const lastRecord = prevHistory.dataRecords[prevHistory.dataRecords.length - 1];
    const lastTime = lastRecord ? new Date(lastRecord.timestamp) : new Date();
    baseTime = new Date(lastTime);
    baseTime.setMinutes(baseTime.getMinutes() - latchPeriodMinutes);
  }

  const records: { timestamp: string; value: number }[] = [];

  for (let i = 0; i < recordCount; i++) {
    const start = offset + i * bytePerRecord;
    const valueBytes = payload.slice(start, start + bytePerRecord);

    let value = 0;
    if (u8CommandCode === 1) value = parseUint32(valueBytes);
    else value = parseUint16(valueBytes);

    try {
      const recordTime = new Date(baseTime);
      recordTime.setMinutes(recordTime.getMinutes() - i * latchPeriodMinutes);

      if (isNaN(recordTime.getTime())) {
        console.warn(`⛔ baseTime hoặc recordTime không hợp lệ:`, baseTime);
        continue;
      }

      const timestamp = recordTime.toISOString();
      console.log(`📊 [Gói ${indexPacket}] Record ${i + 1}/${recordCount} → ${timestamp} (Value=${value})`);

      records.push({ timestamp, value });
    } catch (err) {
      console.error(`❌ Lỗi khi tạo recordTime (baseTime=${baseTime}):`, err);
    }
  }

  // ✅ Update state
  hookProps.setState((prev) => {
    const newHistoryRecords = [...(prev.historyData?.dataRecords || []), ...records];
    newHistoryRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      ...prev,
      meterData: indexPacket === 1 || !prev.meterData
        ? {
            serial: meterSerial,
            currentTime,
            impData,
            expData,
            event,
            batteryLevel,
            latchPeriod: latchPeriodMinutes.toString(),
          }
        : prev.meterData, // không thay đổi header nếu không phải gói đầu tiên
      historyData: {
        serial: meterSerial,
        dataRecords: newHistoryRecords,
      },
    };
  });
}
// Giả sử ta có các hàm xử lý cho từng type
