import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { PropsStore, storeContext } from '../../store';
import { handleGetData } from './handleButton';

type PropsListLine = {
  LINE_ID: string;   // ID của tuyến
  LINE_NAME: string; // Tên tuyến
  ADDRESS: string;   // Địa chỉ
  CODE: string;      // Mã tuyến
  countMeter : number; 
};
export type HookState = {
  status: string;
  isLoading: boolean;
  textLoading : string;
  isBusy: boolean;
  isUpdatingFirmware: boolean;
  progressUpdate: number;
  showProgress: boolean;
  showModalSetName: boolean;

  // thêm mới
  dataListLine: PropsListLine[];
  dataListMeter: any[];
  searchText: string;
  selectedItems: Set<number>;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

  const TAG = ' Controller: ';

  export const hookProps = {} as HookProps;
  export let store = {} as PropsStore;

  export const GetHookProps = (): HookProps => {
    const [state, setState] = useState<HookState>({
      status: '',
      isLoading: false,
      textLoading: '',
      isBusy: false,
      isUpdatingFirmware: false,
      progressUpdate: 0,
      showProgress: false,
      showModalSetName: false,
  
      // default values cho 3 state mới
      dataListLine: [],
      dataListMeter: [],
      searchText: '',
      selectedItems: new Set<number>(),
    });
  
    hookProps.state = state;
    hookProps.setState = setState;
  
    store = React.useContext(storeContext);
  
    return hookProps;
  };
  
export const onInit = async () => {
  //ObjSend.ignoreCheckUpdate = true;
  handleGetData()
  console.log('onInit board Ble');
};

export const onDeInit = () => {
  console.log('onDeInit board Ble');

  //ObjSend.ignoreCheckUpdate = false;
};

export const setStatus = (status: string) => {
  hookProps.setState(state => {
    state.status = status;

    return { ...state };
  });
};
