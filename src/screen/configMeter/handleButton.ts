import { Alert } from 'react-native';
import { screenDatas } from '../../shared';
import { isValidText, showAlert, showSnack } from '../../util';
import { hookProps } from './controller';
import { send } from '../../util/ble';
import { buildGetParamPacket } from '../../service/hhu/aps/hhuAps';
import { LoraCommandCode } from '../../service/hhu/defineEM';
import { store } from '../overview/controller';
const TAG = 'Handle Config Meter:';
export const readConfig = async () => {
  try {
    if (!hookProps.state.serial) {
      Alert.alert('Vui lòng điền serial');
      return;
    }

    const { readCycle, readTimeRange, readDaysPerMonth } = hookProps.state;

    // Gom các flag
    const flags = [readCycle, readTimeRange, readDaysPerMonth];
    const trueCount = flags.filter(Boolean).length;

    if (trueCount === 0) {
      Alert.alert('Vui lòng chọn chỉ số cần đọc');
      return;
    }

    let command: number = LoraCommandCode.LORA_CMD_QUERY_DATA_DETAIL;

    // Trường hợp chỉ readCycle được chọn
    if (readCycle && !readTimeRange && !readDaysPerMonth) {
      command = LoraCommandCode.LORA_CMD_PERIOD_LATCH;
    } 
    // Trường hợp 2 trở lên được chọn
    else if (trueCount >= 2) {
      command = LoraCommandCode.LORA_CMD_SETTING;
    } 
    // Chỉ readDaysPerMonth
    else if (readDaysPerMonth) {
      command = LoraCommandCode.LORA_CMD_WAKEUP_SPECIFIC_DAYS;
    } 
    // Chỉ readTimeRange
    else if (readTimeRange) {
      command = LoraCommandCode.LORA_CMD_TIME_WAKEUP;
    }

    const data = buildGetParamPacket(hookProps.state.serial, command);
    console.log('📤 Data gửi:', data);

    await send(store.state.hhu.idConnected, data);

    console.log('📥 Đọc cấu hình thành công');
  } catch (error) {
    console.error('❌ Lỗi khi đọc cấu hình:', error);
  }
};

export const testConfig = async () => {
  // Tạo mảng 2048 byte với giá trị random từ 0 - 255
  let payload: number[] = Array.from({ length: 50000  }, () => Math.floor(Math.random() * 10));
  console.log (payload)
  // Gửi đi (2048 byte cố định) 
  await send(store.state.hhu.idConnected, payload);
};


// export const readConfig = async (idPeripheral: string) => {
//   try {
//     if (!hookProps.state.serial) {
//       Alert.alert('Vui lòng điền serial');
//       return;
//     }

//     // 🔹 tạo mảng dữ liệu 1001 byte tăng dần từ 0x00, sau đó quay vòng lại
//     const bigData: number[] = Array.from({ length: 1001 }, (_, i) => i % 256);

//     console.log(`📤 Chuẩn bị gửi ${bigData.length} byte`);

//     // BLE/Lora thường giới hạn mỗi lần gửi (20–128 byte tuỳ chip)
//     const CHUNK_SIZE = 128;

//     for (let i = 0; i < bigData.length; i += CHUNK_SIZE) {
//       const chunk = bigData.slice(i, i + CHUNK_SIZE); // number[]
//       await send(idPeripheral, chunk); // hàm send nhận number[] hoặc base64
//       console.log(`📤 Đã gửi chunk ${i / CHUNK_SIZE + 1}`);
//       await new Promise(res => setTimeout(res, 20)); // delay nhỏ để tránh nghẽn
//     }

//     console.log('✅ Gửi toàn bộ 1001 byte thành công');
//   } catch (error) {
//     console.error('❌ Lỗi khi đọc cấu hình:', error);
//   }
// };


export const writeConfig = () => {
  const payload = {
    command: 'LORA_SET_PARAM',
    value: 0x02,
    data: {
      baudRate: 9600,
      channel: 10,
    },
  };

  console.log('📤 Gửi cấu hình:', payload);

};



