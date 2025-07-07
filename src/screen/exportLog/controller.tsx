import React, { useState } from 'react';
import {
  getListFileFromStorage,
  PropsFileInfo
} from '../../shared/file';
import { PATH_EXPORT_LOG } from '../../shared/path';

export type HookState = {
  logList: PropsFileInfo[];
  isBusy: boolean;
  iSelectedAll: boolean;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = 'Export Log Controller: ';

export const hookProps = {} as HookProps;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    logList: [],
    isBusy: false,
    iSelectedAll: false,
  });
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};




export const updateLogFile = async () => {
  const logList = await getListFileFromStorage(PATH_EXPORT_LOG, 'txt');
  // console.log('logList:', logList);

  hookProps.setState(state => {
    state.logList = logList;
    return { ...state };
  });
};

export const onInit = async navigation => {
  navigation.addListener('focus', async () => {
    //console.log('abcdjsdk');

    updateLogFile();
  });
};

export const onDeInit = () => {};
