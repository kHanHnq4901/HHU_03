import AsyncStorage from '@react-native-community/async-storage';
import { PATH_EXECUTE_CSDL, PATH_EXPORT_XML } from '../../shared/path';

const KEY_SETTING = 'APP_SETTING';
const TAG = 'STORAGE SERVICE:';
const KEY_LAST_PATH_IMPORT = 'LAST_PATH_IMPORT';
const KEY_SERI_READ_PARAM = 'SERI_READ_PARAMS';
const KEY_TIME_UPDATE_SERI_VERSION = 'SERIMATCH_VERSION';
export const KEY_USER = 'KEY_USER';
export const KEY_DLHN = 'KEY_DLHN';
export const KEY_MA_CONG_TO = 'KEY_MA_CONG_TO';
const KEY_OBJ_PATH_IMPORT = 'OBJ_PATH_IMPORT';

export type PropsSettingAndAlarm = {
  typeAlarm: 'Value' | 'Percent';
  upperThresholdPercent: string;
  lowerThresholdPercent: string;
  upperThresholdValue: string;
  lowerThresholdValue: string;
};

export type LoginModeType = 'ĐL Hà Nội' | 'NPC' | 'KH Lẻ';

export type PropsAppSetting = {
  password: string;
  passwordAdmin: string;
  passwordDVKH: string;
  passwordSx: string;
  setting: PropsSettingAndAlarm;
  numRetriesRead: string;
  CMISPath: string;
  showResultOKInWriteData: boolean;
  server: {
    host: string;
    port: string;
    hostLayQuyenCMIS: string;
  };
  hhu: {
    host: string;
    port: string;
    enableReadNotGelex: boolean;
    isOnlyGetIntegers: boolean;
  };
  loginMode: LoginModeType;
  isCMISDLHN: boolean;
};

export const getDefaultStorageValue = (): PropsAppSetting => {
  const storageVariable: PropsAppSetting = {
    password: '',
    passwordAdmin: '',
    passwordDVKH: '',
    passwordSx: '',
    setting: {
      typeAlarm: 'Value',
      upperThresholdPercent: '',
      lowerThresholdPercent: '',
      upperThresholdValue: '',
      lowerThresholdValue: '',
    },
    numRetriesRead: '',
    CMISPath: '',
    showResultOKInWriteData: false,
    server: {
      host: '',
      port: '',
      hostLayQuyenCMIS: '',
    },
    hhu: {
      host: '',
      port: '',
      enableReadNotGelex: false,
      isOnlyGetIntegers: true,
    },
    loginMode: 'NPC',
    isCMISDLHN: false,
  };

  storageVariable.CMISPath = '';
  storageVariable.numRetriesRead = '1';
  storageVariable.password =
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  storageVariable.passwordAdmin =
    'fa656a64a169bd0f37f44fc4c42e62f8b533827eff4af4f2050b238da70b0bf3';
  storageVariable.passwordDVKH =
    '177f7293eb7630fa1bc2e446bdfcc05ef7e48cfee57300e12b574f1b264446fa';
  storageVariable.passwordSx =
    '21e1033ae71927932974c4b50bea987be339381cdc9a439142522017c11ec8c6';
  storageVariable.showResultOKInWriteData = false;
  storageVariable.setting = {
    typeAlarm: 'Percent',
    upperThresholdPercent: '150',
    lowerThresholdPercent: '0',
    lowerThresholdValue: '0',
    upperThresholdValue: '200',
  };
  storageVariable.server = {
    host: '',
    port: '',
    hostLayQuyenCMIS: '10.9.195.105:6089',
  };
  storageVariable.hhu = {
    host: '14.225.244.63',
    port: '5050',
    enableReadNotGelex: false,
    isOnlyGetIntegers: true,
  };
  storageVariable.loginMode = 'KH Lẻ';

  return storageVariable;
};

export const updateValueAppSettingFromNvm =
  async (): Promise<PropsAppSetting> => {
    let storageVariable = {} as PropsAppSetting;
    try {
      const result = await AsyncStorage.getItem(KEY_SETTING);
      if (result) {
        const storageVar = JSON.parse(result) as PropsAppSetting;

        storageVariable = { ...storageVar };
        storageVariable.CMISPath = storageVar.CMISPath;
        storageVariable.numRetriesRead = storageVar.numRetriesRead;
        storageVariable.password = storageVar.password;
        storageVariable.setting = storageVar.setting;
        storageVariable.passwordAdmin = storageVar.passwordAdmin;
        storageVariable.server = storageVar.server;
        if (!storageVariable.server.hostLayQuyenCMIS) {
          storageVariable.server.hostLayQuyenCMIS = '10.9.195.105:6089';
        }
        storageVariable.hhu = storageVar.hhu;
        //
        storageVariable.showResultOKInWriteData =
          storageVar.showResultOKInWriteData;

        for (let i in storageVariable) {
          //@ts-expect-error
          if (storageVariable[i] === undefined || storageVariable[i] === null) {
            storageVariable = getDefaultStorageValue();
            //console.log('meet here:', i);
            break;
          }
        }
      } else {
        console.log('meet here 1');
        storageVariable = getDefaultStorageValue();
        //console.log('storageVariable:', storageVariable);
      }
    } catch (err: any) {
      console.log(TAG, err.message);
      console.log('meet here 2');
      storageVariable = getDefaultStorageValue();
    }

    return storageVariable;
  };

export const saveValueAppSettingToNvm = async (value: PropsAppSetting) => {
  try {
    console.log('value to asyncstorage:');
    await AsyncStorage.setItem(KEY_SETTING, JSON.stringify(value));
  } catch (err: any) {
    console.log(TAG, err.message);
  }
};
// this will be deprecated
export const savePathImport = async (path: string) => {
  try {
    console.log('save path to asyncstorage:');
    await AsyncStorage.setItem(KEY_LAST_PATH_IMPORT, path);
  } catch (err: any) {
    console.log(TAG, err.message);
  }
};
// this will be deprecated
export const getLastPathImport = async (): Promise<string> => {
  try {
    console.log('get last path to asyncstorage:');
    let path = await AsyncStorage.getItem(KEY_LAST_PATH_IMPORT);
    if (path) {
      return path;
    } else {
    }
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  return PATH_EXPORT_XML + '/' + 'Trống.XML';
};

// export type PropsObjPathImport = { [key : string] : {path:string, id: string}};

// export const saveObjPathImport = async (objPath: PropsObjPathImport) => {
//   try {
//     console.log('save obj path to asyncstorage:');
//     await AsyncStorage.setItem(KEY_OBJ_PATH_IMPORT, JSON.stringify(objPath));
//   } catch (err: any) {
//     console.log(TAG, err.message);
//   }
// };

// export const getObjPathImport = async (): Promise<PropsObjPathImport | null> => {
//   try {
//     console.log('get last obj path to asyncstorage:');
//     let objPathStr = await AsyncStorage.getItem(KEY_OBJ_PATH_IMPORT);
//     if (objPathStr) {
//       return JSON.parse(objPathStr);
//     } else {
//     }
//   } catch (err: any) {
//     console.log(TAG, err.message);
//   }
//   return null;
  
// };

export const saveArrSeri = async (arrSeri: string[]) => {
  try {
    //console.log('save path to asyncstorage:');
    await AsyncStorage.setItem(KEY_SERI_READ_PARAM, JSON.stringify(arrSeri));
  } catch (err: any) {
    console.log(TAG, err.message);
  }
};

export const getArrSeri = async (): Promise<string[]> => {
  try {
    console.log('get last path to asyncstorage:');
    let arrSeriString = await AsyncStorage.getItem(KEY_SERI_READ_PARAM);
    if (!arrSeriString) {
    } else {
      const arrSEri: string[] = JSON.parse(arrSeriString);
      return arrSEri;
    }
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  return [];
};

export const saveVersionUpdateFileMatchSeriVersion = async (
  version: string,
) => {
  try {
    //console.log('save path to asyncstorage:');
    await AsyncStorage.setItem(
      KEY_TIME_UPDATE_SERI_VERSION,
      JSON.stringify(version),
    );
  } catch (err: any) {
    console.log(TAG, err.message);
  }
};

export const getVersionUpdateFileMatchSeriVersion =
  async (): Promise<string> => {
    try {
      //console.log('get last path to asyncstorage:');
      let lastUpdate = await AsyncStorage.getItem(KEY_TIME_UPDATE_SERI_VERSION);
      if (!lastUpdate) {
        return '';
      } else {
        lastUpdate = JSON.parse(lastUpdate) as string;
        return lastUpdate;
      }
    } catch (err: any) {
      console.log(TAG, err.message);
    }
    return '';
  };
