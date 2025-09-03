import AsyncStorage from '@react-native-community/async-storage';
import { PATH_EXECUTE_CSDL, PATH_EXPORT_XML } from '../../shared/path';

const KEY_SETTING = 'APP_SETTING';
const TAG = 'STORAGE SERVICE:';
export const KEY_USER = 'KEY_USER';
export const KEY_DLHN = 'KEY_DLHN';
export const KEY_MA_CONG_TO = 'KEY_MA_CONG_TO';
export type PropsSettingAndAlarm = {
  distance : string;
  typeAlarm: 'Value' | 'Percent';
  upperThresholdPercent: string;
  lowerThresholdPercent: string;
  upperThresholdValue: string;
  lowerThresholdValue: string;
};
export type PropsAppSetting = {
  password: string;
  setting: PropsSettingAndAlarm;
  numRetriesRead: string;
  CMISPath: string;
  showResultOKInWriteData: boolean;
  
  server: {
    host: string;
    port: string;
  };
  hhu: {
    host: string;
    port: string;
    enableReadNotGelex: boolean;
    isOnlyGetIntegers: boolean;
  };
};

export const getDefaultStorageValue = (): PropsAppSetting => {
  const storageVariable: PropsAppSetting = {
    password: '',
    setting: {
      distance : '500',
      typeAlarm: 'Value',
      upperThresholdPercent: '500',
      lowerThresholdPercent: '0',
      upperThresholdValue: '500',
      lowerThresholdValue: '0',
    },
    numRetriesRead: '',
    CMISPath: '',
    showResultOKInWriteData: false,
    server: {
      host: 'kh.emic.com.vn',
      port: '80',
    },
    hhu: {
      host: '',
      port: '',
      enableReadNotGelex: false,
      isOnlyGetIntegers: true,
    },
  };

  storageVariable.numRetriesRead = '1';

  storageVariable.showResultOKInWriteData = false;
  storageVariable.server = {
    host: 'kh.emic.com.vn',
    port: '80',
  };
  storageVariable.hhu = {
    host: '14.225.244.63',
    port: '5050',
    enableReadNotGelex: false,
    isOnlyGetIntegers: true,
  };

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
        storageVariable.server = storageVar.server;
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