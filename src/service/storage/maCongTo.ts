import AsyncStorage from '@react-native-community/async-storage';
import { KEY_MA_CONG_TO as KEY } from './index';
import { GetMaCongToFromServer } from '../api';
import { showSnack } from '../../util';

const TAG = 'Ma cong to Storage';

let maCongToObjStorage = {} as PropsMaCongToStorage;

export type PropsMaCongToStorage = {
  version: string;
  data: {
    'CE-18G': string[];
    'CE-18': string[];
    'CE-14': string[];
    'ME-40': string[];
    'ME-41': string[];
    'ME-42': string[];
    Elster: string[];
  };
};

function getDefaultMaCongTo(): PropsMaCongToStorage {
  const defaultValue: PropsMaCongToStorage = {
    version: 'default',
    data: {
      'CE-18G': ['576', '575', '432', '121', '340', 'B26', 'D26', '424', '421'],
      'CE-18': [
        '654',
        'B10',
        'B48',
        'B11',
        'B61',
        'B29',
        'B73',
        'B74',
        'B72',
        'CE18',
      ],
      'CE-14': ['416', 'D23', 'M3B', '101', 'CE14'],
      'ME-40': ['655', 'D65', 'D66', 'ME40'],
      'ME-41': ['304', 'F92', 'ME41'],
      'ME-42': ['305', 'D73', 'F98', 'D70', 'ME42'],
      Elster: ['790', '636', '772', '773', '577', '632', '755', '770', '771'],
    },
  };

  return defaultValue;
}

export async function getMaCongToStorage(): Promise<PropsMaCongToStorage> {
  try {
    const strResult = await AsyncStorage.getItem(KEY);

    if (strResult) {
      const user: PropsMaCongToStorage = JSON.parse(strResult);

      return user;
    } else {
      return getDefaultMaCongTo();
    }
  } catch (err: any) {
    console.log(TAG, 'Lỗi:', err.message);
  }
  return getDefaultMaCongTo();
}

export async function saveMaCongToStorage(
  user: PropsMaCongToStorage,
): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(user));
  } catch (err: any) {
    console.log(TAG, 'Lỗi:', err.message);
  }
  return;
}

export async function UpdateMaCongToObjFromStorageAndServer(): Promise<PropsMaCongToStorage> {
  maCongToObjStorage = await getMaCongToStorage();

  const rest = await GetMaCongToFromServer();
  if (rest.bSucceed) {
    const maCongToFromServer = rest.obj as PropsMaCongToStorage;
    console.log('maCongToFromServer.version:', maCongToFromServer.version);

    if (maCongToObjStorage.version !== maCongToFromServer.version) {
      console.log('Update Ma cong to from server');

      showSnack('Đã cập nhật mã đồng hồ mới');

      saveMaCongToStorage(maCongToFromServer);
      maCongToObjStorage = { ...maCongToFromServer };
    }
  }

  return maCongToObjStorage;
}

export function GetObjMaCongToFromStorage() {
  return maCongToObjStorage;
}
