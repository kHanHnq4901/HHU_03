import { Alert } from "react-native";
import { hookProps } from "./controller";
import { LoraCommandCode } from "../../service/hhu/defineEM";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { store } from "../overview/controller";
import { send } from "../../util/ble";

export const onReadData = async () => {
  try {
    if (!hookProps.state.serial) {
      Alert.alert('Vui lòng điền serial');
      return;
    }
    hookProps.setState((prev) => ({ ...prev, meterData: null }))
    const data = buildQueryDataPacket(hookProps.state.serial,hookProps.state.isDetailedRead);
    console.log('📤 Data gửi:', data);

    await send(store.state.hhu.idConnected, data);

    console.log('📥 Đọc cấu hình thành công');
  } catch (error) {
    console.error('❌ Lỗi khi đọc cấu hình:', error);
  }
};
// Giả sử ta có các hàm xử lý cho từng type
function parseDate(timeBytes: number[]): string {
  const [yy, MM, dd, hh, mm, ss] = timeBytes;
  const year = 2000 + yy;
  return `${year}-${MM.toString().padStart(2, "0")}-${dd
    .toString()
    .padStart(2, "0")} ${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function parseUint32(bytes: number[]): number {
  // Nếu ít hơn 4 byte thì padding thêm 0
  const b0 = bytes[0] ?? 0;
  const b1 = bytes[1] ?? 0;
  const b2 = bytes[2] ?? 0;
  const b3 = bytes[3] ?? 0;

  return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
}
export function responeData(payload: number[], meterSerial: string) {
  if (payload.length < 2) {
    console.warn("⚠️ Payload quá ngắn:", payload);
    return;
  }

  const indexPacket = payload[0];

  let currentTime = "";
  let impData = 0;
  let expData = 0;
  let event = "";
  let batteryLevel = "";
  let latchPeriodMinutes = 0; // đổi ra phút
  let records: { timestamp: string; value: number }[] = [];

  let offset = 2;

  if (indexPacket === 1) {
    // Current Time (6 byte)
    const timeBytes = payload.slice(offset, offset + 6);
    currentTime = parseDate(timeBytes); // parse ra string (YYYY-MM-DD HH:mm:ss)
    offset += 6;

    // impData (4 byte)
    const impBytes = payload.slice(offset, offset + 4);
    impData = parseUint32(impBytes);
    offset += 4;

    // expData (4 byte)
    const expBytes = payload.slice(offset, offset + 4);
    expData = parseUint32(expBytes);
    offset += 4;

    // Event (1 byte)
    event = payload[offset].toString(16).padStart(2, "0");
    offset += 1;

    // Battery (1 byte)
    const voltage = payload[offset] / 10;
    const percentage = Math.min(100, Math.max(0, (voltage / 3.6) * 100));
    batteryLevel = `${percentage.toFixed(0)}%`;
    offset += 1;

    // Latch Period (2 byte)
    const latchBytes = payload.slice(offset, offset + 2);
    latchPeriodMinutes = (latchBytes[0] & 0xff) | ((latchBytes[1] & 0xff) << 8); 
    offset += 2;

    // Parse Data Records (mỗi record giả sử là 4 byte số)
    const baseTime = new Date(currentTime); // Date object từ currentTime
    const rawRecords = payload.slice(offset);
    for (let i = 0; i < rawRecords.length; i += 2) {
      const valueBytes = rawRecords.slice(i, i + 2);
      const value = parseUint32(valueBytes);
      const recordTime = new Date(baseTime);
      // Lùi dần theo latchPeriod * số record trước đó
      recordTime.setMinutes(recordTime.getMinutes() - (i / 4) * latchPeriodMinutes);

      records.push({
        timestamp: recordTime.toISOString(), // hoặc format lại HH:mm
        value,
      });
    }

    // ✅ Gói đầu tiên → reset dữ liệu cũ
    hookProps.setState((prev) => ({
      ...prev,
      meterData: {
        serial: meterSerial,
        currentTime,
        impData,
        expData,
        event,
        batteryLevel,
        latchPeriod: latchPeriodMinutes.toString(),
        dataRecords: records,
      },
    }));
  } else {
    // ✅ Các gói tiếp theo → nối dữ liệu
    hookProps.setState((prev) => {
      const prevRecords = prev.meterData?.dataRecords || [];
      const baseTime = new Date(prev.meterData?.currentTime || new Date());
      const newRecords: { timestamp: string; value: number }[] = [];

      const rawRecords = payload.slice(offset);
      for (let i = 0; i < rawRecords.length; i += 2) {
        const valueBytes = rawRecords.slice(i, i + 2);
        console.log ( 'rawRecords' + rawRecords.slice(i, i + 2))
        const value = parseUint32(valueBytes);
        const recordTime = new Date(baseTime);
        // Tính timestamp dựa trên số lượng record đã có
        recordTime.setMinutes(
          recordTime.getMinutes() - ((prevRecords.length + i / 4) * Number(prev.meterData?.latchPeriod || 0))
        );
        newRecords.push({
          timestamp: recordTime.toISOString(),
          value,
        });
      }

      return {
        ...prev,
        meterData: {
          ...prev.meterData,
          dataRecords: [...prevRecords, ...newRecords],
        },
      };
    });
  }

  console.log(`✅ Đã xử lý gói tin #${indexPacket}`, {
    serial: meterSerial,
    currentTime,
    impData,
    expData,
    event,
    batteryLevel,
    latchPeriodMinutes,
    dataRecords: indexPacket === 1 ? records : "(nối thêm)",
  });
}




