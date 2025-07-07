import React, { useState } from 'react';
import { PropsStore, storeContext } from '../../store';
import { PropsFileInfo } from '../../shared/file';
import RNFS from 'react-native-fs';

export type HookState = {
  contentFile: string;
  isBusy: boolean;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = 'Header Controller: ';

export const hookProps = {} as HookProps;
export let store = {} as PropsStore;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    contentFile:'',
    isBusy: true,
  });
  hookProps.state = state;
  hookProps.setState = setState;
  store = React.useContext(storeContext) as PropsStore;
  return hookProps;
};

export const onInit = async (fileInfo: PropsFileInfo) => {

  let str = await RNFS.readFile(fileInfo.path);
  hookProps.setState(state => {

    state.contentFile = str;
    state.isBusy = false;
    return {...state};
  });
};

export const onDeInit = () => {};
