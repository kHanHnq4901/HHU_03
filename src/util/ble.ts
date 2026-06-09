import { Alert, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { sleep } from '.';
import { Buffer } from 'buffer'; // cần import Buffer
import { onBlePress } from '../screen/overview/handleButton';
import { crc16 } from './crc16';
const TAG = 'Ble.ts:';

let service: string ;
let characteristic: string;

export const requestBlePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    try {
      let allow = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (allow) {
        return true;
      } else {
        let granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log(granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('permission is ok');
        } else {
          console.log('permission is denied');
        }
      }
    } catch {}
  }0
  return Promise.resolve(true);
};

export const connect = async (id: string): Promise<boolean> => {
  for (let i = 0; i < 2; i++) {
    try {
      await BleManager.stopScan();
      // let waitOk = false;
      // setTimeout(() => {
      //   if (waitOk === false) {
      //     console.log('connect timeout, disconnect');

      //     BleManager.disconnect(id);
      //   }
      // }, 5000);
      await BleManager.connect(id);
      //waitOk = true;
      //BleManager.createBond(id);
      return true;
    } catch (err: any) {
      console.log(TAG, err);
      console.log('aaa id:', id);

      return false;
    }
    await sleep(1000);
  }
  return false;
};

export const startNotification = async (idPeripheral: string) => {
  try {
    const res = await BleManager.retrieveServices(idPeripheral);

    const info = res as unknown as {
      characteristics: {
        characteristic: string;
        service: string;
        properties?: {
          Notify?: 'Notify';
          Read?: 'Read';
          Write?: 'Write';
          WriteWithoutResponse?: 'WriteWithoutResponse';
        };
      }[];
    };


    let element = info.characteristics.find(element => {
      return (
        element.characteristic &&
        element.properties?.Write &&
        element.properties?.Notify &&
        element.service
      );
    });
    console.log('element:', element);
    if (!element) {
      console.log(TAG, 'no find element');
      return;
    }
    service = element.service;
    characteristic = element.characteristic;
    
    BleManager.startNotification(
      idPeripheral, service, characteristic
    )
      .then(() => {
        
        console.log("Notification started");
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
   
  } catch (err: any) {
    console.log(TAG, err);
  }
};

// 🟢 Hàm kiểm tra kết nối và thông báo
export const checkPeripheralConnection = async (idPeripheral: string): Promise<boolean> => {
  try {
    const isConnected = await BleManager.isPeripheralConnected(idPeripheral, []);
    if (!isConnected) {
      Alert.alert(
        'Thông báo',
        'Chưa kết nối với thiết bị, bạn có muốn kết nối lại với thiết bị đã dùng trước đó không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Kết nối lại', onPress: () => onBlePress() },
        ],
        { cancelable: true }
      );
      return false;
    }
    return true;
  } catch (err) {
    console.log(TAG + 'Lỗi kiểm tra kết nối:', err);
    return false;
  }
};

// 🟢 Hàm send mới gọn gàng hơn
export const send = async (idPeripheral: string, data: number[]) => {
  try {
    const START = 0xAA;
    const COMMAND = 0x00;
    const LENGTH = data.length;
    const lengthLow = LENGTH & 0xff;
    const lengthHigh = (LENGTH >> 8) & 0xff;
    const baseData = [START,COMMAND, lengthLow,lengthHigh, ...data];
    const buf = Buffer.from(baseData);
    const crc = crc16(buf, buf.length);
    const OKE_BYTES = [0x4F, 0x4B, 0x45];
    const fullFrame = [...baseData,crc & 0xff,(crc >> 8) & 0xff,...OKE_BYTES];
    console.log ("fullFrame" + fullFrame)
    await BleManager.write(idPeripheral, service, characteristic, fullFrame,256);
  } catch (err: any) {
    console.log(TAG + 'Error sending:', err);
  }
};
export const sendOptical = async (idPeripheral: string, data: number[]) => {
  try {
    const payloadArray = Uint8Array.from(data);

    // ✅ CRC1 cho payload
    const crcdata = crc16(payloadArray, payloadArray.length);
    const DataFull = [...data, crcdata & 0xff, (crcdata >> 8) & 0xff];
    console.log("📦 DataFull (payload+CRC1), length=", DataFull.length);

    const START = 0xaa;
    const COMMAND = 0x01;
    const lengthValue = DataFull.length; // chỉ tính payload + CRC1
    const lengthLow = lengthValue & 0xff;
    const lengthHigh = (lengthValue >> 8) & 0xff;
    const baseData = [START, COMMAND, lengthLow, lengthHigh, ...DataFull];
    const baseArray = Uint8Array.from(baseData);
    const crc = crc16(baseArray, baseArray.length);

    const OKE_BYTES = [0x4F, 0x4B, 0x45];
    const fullFrame = [...baseData, crc & 0xff, (crc >> 8) & 0xff, ...OKE_BYTES];

    console.log("📤 FullFrame length=", fullFrame.length, "bytes");

    // 🟢 Gửi BLE theo chunk 128 bytes
    const chunkSize = 128;
    for (let offset = 0; offset < fullFrame.length; offset += chunkSize) {
      const chunk = fullFrame.slice(offset, offset + chunkSize);
      await BleManager.write(idPeripheral, service, characteristic, chunk, 256);
      console.log(`📤 Sent chunk [${offset} - ${offset + chunk.length - 1}] (${chunk.length} bytes)`);
    }

    console.log("✅ Gửi fullFrame hoàn tất.");
  } catch (err: any) {
    console.log(TAG + " Error sending:", err);
    Alert.alert("Lỗi " + err);
  }
};
export const sendHHU = async (idPeripheral: string, data: number[]) => {
  try {
    // Thêm 3 byte "OKE" (ASCII: 0x4F 0x4B 0x45)
    const OKE_BYTES = [0x4F, 0x4B, 0x45];
    const finalData = [...data, ...OKE_BYTES];

    await BleManager.write(idPeripheral, service, characteristic, finalData, 256);

    console.log("✅ Đã gửi dữ liệu kèm OKE:", finalData);
  } catch (err: any) {
    console.log(TAG + "Error sending:", err);
  }
};
export const stopNotification = async (idPeripheral: string) => {
  try {
    await BleManager.stopNotification(idPeripheral, service, characteristic);
  } catch (err: any) {
    console.log(TAG, err);
  }
};
