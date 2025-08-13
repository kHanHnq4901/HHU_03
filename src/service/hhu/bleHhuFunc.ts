import * as Ble from '../../util/ble';
import AsyncStorage from '@react-native-community/async-storage';
import { Buffer } from 'buffer';
import { HhuObj, ObjSend, readVersion, ShakeHand, waitHHU } from './hhuFunc';
import {
  BufferToString,
  ByteArrayToString,
  showAlert,
  showToast,
  sleep,
} from '../../util';
import BleManager from 'react-native-ble-plx';
import { PropsStore } from '../../store';
import { checkUpdateHHU } from '../api';
import { Platform } from 'react-native';
import { bleManagerEmitter } from '../../screen/ble/controller';
import { manager } from '../../screen/ble/handleButton';

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

    await Ble.send(id,dumy);

  } catch (err: any) {
    console.error(err);
  }
};


export const BleFunc_SaveStorage = async (id: string) => {
  const item: PropsBleInfo = {
    id: id,
  };
  try {
    AsyncStorage.setItem(KEY_STORAGE, JSON.stringify(item));
  } catch (err: any) {
    console.log(TAG, String(err));
  }
};

export const BleFunc_TryConnectToLatest = async (): Promise<{
  result: boolean;
  id: string;
}> => {
  try {
    const resString = await AsyncStorage.getItem(KEY_STORAGE);
    if (resString) {
      const data = JSON.parse(resString) as PropsBleInfo;
      let result: boolean = false; // hoặc true tùy logic

      console.log('try connect to data.id: ', data.id);
      // if (Platform.OS === 'ios') {
      //   await BleManager.refreshCache(data.id);
      // }
      for (let i = 0; i < 1; i++) {
        result = await Ble.connect(data.id);

        console.log('Connect result: ', result);
        if (result) {
          break;
          // await Ble.startnotification(data.id);
          // const dumy = [0];
          // await Ble.send(data.id, dumy);
          // await Ble.stopNotification(data.id);
        }
        await sleep(500);
      }

      return { result: result, id: data.id };
    } else {
      return { result: false, id: '' };
    }
  } catch (err: any) {
    console.log(TAG, String(err) + new Error().stack);
  }
  return { result: false, id: '' };
};

export async function initModuleBle() {
  await manager.state({ showAlert: false });
}

export const connectLatestBLE = async (store: PropsStore) => {
  console.log(TAG, 'try connect to latest');

  store.setState(state => {
    state.hhu.connect = 'CONNECTING';
    return { ...state };
  });

  let isEnable = true;

  try {
    if (Platform.OS === 'android') {
      await manager.enable; // Android: bật bluetooth
    } else {
      //manager.checkState(); // iOS: check trạng thái

      const statePromise = new Promise<boolean>((resolve) => {
        const sub = bleManagerEmitter.addListener(
          'BleManagerDidUpdateState',
          ({ state }) => {
            console.log('iOS Bluetooth State:', state);
            sub.remove(); // remove listener sau khi nhận được trạng thái
            resolve(state === 'on');
          }
        );

        // fallback timeout nếu không có phản hồi
        setTimeout(() => {
          sub.remove();
          resolve(false); // assume off nếu không có phản hồi
        }, 3000);
      });

      isEnable = await statePromise;
    }
  } catch (error) {
    console.log(TAG, 'Bluetooth check failed', error);
    isEnable = false;
  }

  if (!isEnable) {
    store.setState(state => {
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });
    showAlert('Thiết bị chưa được bật Bluetooth');
    return;
  }

  showToast('Đang thử kết nối với thiết bị Bluetooth trước đó ...');
  const data = await BleFunc_TryConnectToLatest();
  console.log(TAG, 'Kết quả kết nối:', data);

  if (data.result) {
    let rssi: number = 0;

    store.setState(state => {
      state.hhu.connect = 'CONNECTED';
      state.hhu.idConnected = data.id;
      state.hhu.rssi = rssi;
      return { ...state };
    });

    ObjSend.id = data.id;
    ObjSend.isShakeHanded = false;

    for (let k = 0; k < 2; k++) {
      await sleep(500);
      const result = await ShakeHand();
      if (result === true || result === 1) {
        ObjSend.isShakeHanded = true;
        break;
      }
      console.log(TAG, 'Try shakehand lần', k + 1);
    }

    if (!ObjSend.isShakeHanded) {
      console.log(TAG, 'ShakeHand thất bại. Ngắt kết nối');
      showToast('ShakeHand thất bại. Đã ngắt kết nối');
      await manager.disable(ObjSend.id);
      store.setState(state => {
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      return;
    }

    showToast('Bắt tay thành công');

    // đọc version
    for (let k = 0; k < 2; k++) {
      await sleep(500);
      const version = await readVersion();
      if (version) {
        const shortVersion = version
          .split('.')
          .slice(0, 2)
          .join('.')
          .toLowerCase()
          .replace('v', '');

        store.setState(state => {
          state.hhu.version = version;
          state.hhu.shortVersion = shortVersion;
          return { ...state };
        });

        console.log(TAG, 'Read version succeed:', version);
        checkUpdateHHU();
        break;
      } else {
        console.log(TAG, 'Read version failed. Thử lại...');
      }
    }
  } else {
    store.setState(state => {
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });

    console.log(TAG, 'Kết nối thất bại:', data);
    showToast('Kết nối Bluetooth thất bại');
  }
};

export const handleUpdateValueForCharacteristic = (data: {
  peripheral: string;
  characteristic: string;
  value: number[];
}) => {
  console.log('handleUpdateValueForCharacteristic' + data.value);

  const receiveData = data.value; // chính là mảng byte từ thiết bị

  for (let i = 0; i < receiveData.length; i++) {
    const rxData = receiveData[i] & 0xff;

    if (HhuObj.identityFrame.bActive === false) {
      HhuObj.identityFrame.bActive = true;
      HhuObj.identityFrame.u8CountRecIdentity = 0;
      HhuObj.identityFrame.bIdentityFinish = false;
    }

    if (HhuObj.identityFrame.bIdentityFinish === false) {
      HhuObj.identityFrame.au8IdentityBuff[
        HhuObj.identityFrame.u8CountRecIdentity
      ] = rxData;
      HhuObj.identityFrame.u8CountRecIdentity++;

      if (
        HhuObj.identityFrame.u8CountRecIdentity ===
        HhuObj.identityFrame.au8IdentityBuff.length
      ) {
        if (
          HhuObj.identityFrame.au8IdentityBuff[0] === 0xfe &&
          HhuObj.identityFrame.au8IdentityBuff[1] === 0xfe
        ) {
          if (
            ((HhuObj.identityFrame.au8IdentityBuff[2] +
              HhuObj.identityFrame.au8IdentityBuff[3]) &
              0xff) !==
            (HhuObj.identityFrame.au8IdentityBuff[4] & 0xff)
          ) {
            HhuObj.identityFrame.bActive = false;
          } else {
            HhuObj.identityFrame.bIdentityFinish = true;
            HhuObj.identityFrame.u16Length =
              (HhuObj.identityFrame.au8IdentityBuff[2] & 0xff) |
              ((HhuObj.identityFrame.au8IdentityBuff[3] & 0xff) << 8);
            HhuObj.countRec = 0;
          }
        } else {
          HhuObj.identityFrame.bActive = false;
        }
      }
    } else if (HhuObj.identityFrame.bIdentityFinish === true) {
      HhuObj.buffRx[HhuObj.countRec] = rxData;
      HhuObj.countRec = (HhuObj.countRec + 1) % HhuObj.buffRx.byteLength;

      if (HhuObj.countRec === HhuObj.identityFrame.u16Length) {
        HhuObj.flag_rec = true;
        HhuObj.identityFrame.bActive = false;
      }
    }
  }
};

