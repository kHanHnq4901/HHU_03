import * as Ble from '../../util/ble';
import AsyncStorage from '@react-native-community/async-storage';
import { Buffer } from 'buffer';
import { HhuObj, ObjSend, readVersion, waitHHU } from './hhuFunc';
import {
  BufferToString,
  ByteArrayToString,
  showAlert,
  showToast,
  sleep,
} from '../../util';
import { PropsStore } from '../../store';
import { checkUpdateHHU } from '../api';
import { Platform } from 'react-native';
import { bleManagerEmitter } from '../../screen/ble/controller';
import BleManager from 'react-native-ble-manager';
import { responeSetting } from '../../screen/configMeter/controller';
const KEY_STORAGE = 'BLE_INFO';
const TAG = 'Ble Func:';

type PropsBleInfo = {
  id: string;
};

// type IdentityFrameType = {
//   u32Tick: number;
//   u16Length: number;
//   au8IdentityBuff: any[];
//   u8CountRecIdentity: number;
//   bActive: boolean;
//   bIdentityFinish: boolean;
// };

// const HhuObj.identityFrame: IdentityFrameType = {
//   u32Tick: 0,
//   u16Length: 0,
//   au8IdentityBuff: new Array(5),
//   u8CountRecIdentity: 0,
//   bActive: false,
//   bIdentityFinish: false,
// };

export const BleFunc_StartNotification = async (id: string) => {
  await Ble.startNotification(id);
};

export const BleFunc_StopNotification = async (id: string) => {
  await Ble.stopNotification(id);
};

export const BleFunc_Send = async (id: string, data: number[]) => {
  try {

    let dumy: number[] = [];

    dumy.push(0xfe); // Byte 1
    dumy.push(0xfe); // Byte 2
    dumy.push(data.length & 0xff); // Low byte của length
    dumy.push((data.length >> 8) & 0xff); // High byte của length
    dumy.push((dumy[2] + dumy[3]) & 0xff); // Checksum length

    // Payload
    for (let i = 0; i < data.length; i++) {
      dumy.push(data[i]);
    }
    console.log (dumy)
    await Ble.send(id,dumy);

  } catch (err: any) {
    console.error(err);
  }
};


export const BleFunc_SaveStorage = async (id: string) => {
  const item: PropsBleInfo = { id };
  try {
    await AsyncStorage.setItem(KEY_STORAGE, JSON.stringify(item));
  } catch (err: any) {
    console.log(TAG, String(err));
  }
};

export const BleFunc_TryConnectToLatest = async (): Promise<{
  result: boolean;
  id: string;
  name: string;
}> => {
  try {
    const resString = await AsyncStorage.getItem(KEY_STORAGE);

    if (!resString) {
      return { result: false, id: '', name: '' };
    }

    const data = JSON.parse(resString) as PropsBleInfo;
    console.log('Try connect to device id:', data.id);

    // Thử kết nối lại tối đa 3 lần
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await BleManager.connect(data.id);
        console.log(`Attempt ${attempt}: Connected to ${data.id}`);

        // 🔍 Lấy thông tin thiết bị sau khi kết nối
        let deviceInfo: any = null;
        try {
          deviceInfo = await BleManager.retrieveServices(data.id);
        } catch (infoErr) {
          console.log('⚠️ retrieveServices failed:', infoErr);
        }

        const deviceName =
          deviceInfo?.name ||
          deviceInfo?.advertising?.localName ||
          'Unknown Device';

        return { result: true, id: data.id, name: deviceName };
      } catch (err) {
        console.log(`Attempt ${attempt}: Connect failed`, err);
        await sleep(500); // nghỉ 500ms rồi thử lại
      }
    }

    // Nếu thử hết 3 lần mà vẫn fail
    return { result: false, id: data.id, name: '' };
  } catch (err: any) {
    console.log(TAG, 'BleFunc_TryConnectToLatest Error:', err);
    return { result: false, id: '', name: '' };
  }
};





export async function initModuleBle() {
  await BleManager.start({ showAlert: false });
}

export const connectLatestBLE = async (store: PropsStore) => {
  console.log(TAG, '🔄 Try connect to latest device...');

  // Cập nhật trạng thái: Đang kết nối
  store.setState(state => {
    state.hhu.connect = 'CONNECTING';
    return { ...state };
  });

  let isEnable = true;

  try {
    if (Platform.OS === 'android') {
      try {
        await BleManager.enableBluetooth();
        console.log("✅ Bluetooth enabled (Android)");
      } catch (err) {
        console.log("❌ User refused to enable Bluetooth (Android)", err);
        isEnable = false;
      }
    } else {
      // iOS: check trạng thái qua listener
      const statePromise = new Promise<boolean>((resolve) => {
        const sub = BleManager.onDidUpdateState(
          ({ state }: { state: string }) => {
            console.log('ℹ️ iOS Bluetooth State:', state);
            sub.remove();
            resolve(state === 'on');
          }
        );

        // fallback timeout 3s
        setTimeout(() => {
          sub.remove();
          resolve(false);
        }, 3000);
      });

      isEnable = await statePromise;
    }
  } catch (error) {
    console.log(TAG, '❌ Bluetooth check failed', error);
    isEnable = false;
  }

  // Nếu Bluetooth chưa bật → báo & thoát
  if (!isEnable) {
    store.setState(state => {
      state.hhu.name = '';
      state.hhu.idConnected = '';
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });
    showAlert('Vui lòng bật Bluetooth trước khi kết nối thiết bị');
    return { result: false, id: '' };
  }

  // Bắt đầu thử kết nối
  showToast('Đang thử kết nối với thiết bị Bluetooth đã lưu...');
  const data = await BleFunc_TryConnectToLatest();
  console.log(TAG, 'Kết quả kết nối:', data);

  if (data.result) {
    // Thành công
    store.setState(state => {
      state.hhu.name = data.name;
      state.hhu.connect = 'CONNECTED';
      state.hhu.idConnected = data.id;
      state.hhu.rssi = 0;
      return { ...state };
    });

    ObjSend.id = data.id;

    showToast('Kết nối thành công');
    BleFunc_StartNotification(data.id)
    console.log(TAG, `Connected to device: ${data.id}`);

    return { result: true, id: data.id };
  } else {
    // Thất bại
    store.setState(state => {
      state.hhu.name = '';
      state.hhu.idConnected = '';
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });

    showToast('Không thể kết nối với thiết bị đã lưu. Vui lòng thử lại.');
    console.log(TAG, 'Failed to connect to latest device');

    return { result: false, id: '' };
  }
};

// Giả sử ta có các hàm xử lý cho từng type
function handleType1(payload: number[]) {
  console.log("🔹 Xử lý Type 1:", payload);
}


function handleType2(payload: number[]) {
  console.log("🔹 Xử lý Type 2:", payload);
}

export const handleUpdateValueForCharacteristic = (data: { value: number[] }) => {
  console.log('data update for characteristic:', data.value);
  const receiveData = data.value;

  const buf = Buffer.from(receiveData);

  if (buf.length >= 8 && buf[0] === 0x02 && buf[1] === 0x08) {
    console.log("✅ Header hợp lệ");
    const payload = Array.from(buf.slice(8));
    switch (buf[2]){
      case 0x01:
        handleType1(payload);
        break;
      case 0x03:
        responeSetting(payload);
        break;
      case 0x02:
        handleType2(payload);
        break;
      default:
        console.log("⚠️ Unknown type:", buf[3], payload);
    }

    HhuObj.flag_rec = true;
    HhuObj.identityFrame.bActive = false;
  } else {
    console.log("❌ Header không hợp lệ hoặc dữ liệu quá ngắn");
    HhuObj.identityFrame.bActive = false;
  }
};



