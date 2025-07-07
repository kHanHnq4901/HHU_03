import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { PropsStore, storeContext } from '../../store';

export const variable = {
  onOkChangeName: text => {},
  onDismiss: () => {},
};

export type HookState = {
  status: string;
  isLoading: boolean;
  isBusy: boolean;
  isUpdatingFirmware: boolean;
  progressUpdate: number;
  showProgress: boolean;
  showModalSetName: boolean;
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
    isBusy: false,
    isUpdatingFirmware: false,
    progressUpdate: 0,
    showProgress: false,
    showModalSetName: false,
  });
  hookProps.state = state;
  hookProps.setState = setState;

  store = React.useContext(storeContext);

  return hookProps;
};

export const onInit = async () => {
  //ObjSend.ignoreCheckUpdate = true;
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
