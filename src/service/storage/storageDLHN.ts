import AsyncStorage from '@react-native-community/async-storage';
import { KEY_DLHN } from '.';
import { LOAI_CSO_CMIS } from '../api/serverData';

const TAG = 'Storage DLHN:';

export type PropsStorageDLHN = {
  maDoi: string;
  maDonvi: string;
  maSoGCS: string;
  ky: string;
  thang: string;
  nam: string;
  loaiCS: LOAI_CSO_CMIS;
};

export const saveInfoDLHN = async (props: Partial<PropsStorageDLHN>) => {
  try {
    const lastInfo = await getLastInfoDLHN();
    const info = { ...lastInfo, ...props };
    console.log('save path to asyncstorage:');
    await AsyncStorage.setItem(KEY_DLHN, JSON.stringify(info));
  } catch (err: any) {
    console.log(TAG, err.message);
  }
};

export const getLastInfoDLHN = async (): Promise<PropsStorageDLHN> => {
  const defaultValue: PropsStorageDLHN = {
    maDoi: '',
    maDonvi: '',
    maSoGCS: '',
    ky: '',
    thang: '',
    nam: '',
    loaiCS: 'CSC',
  };
  try {
    console.log('get last path to asyncstorage:');
    let lastInfo = await AsyncStorage.getItem(KEY_DLHN);
    if (lastInfo) {
      return JSON.parse(lastInfo);
    } else {
    }
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  return defaultValue;
};
