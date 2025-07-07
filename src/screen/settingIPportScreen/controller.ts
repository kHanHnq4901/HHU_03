import React from 'react';
import { PropsStore, storeContext } from '../../store';
import { PropsAppSetting } from '../../service/storage';

type PropsState = {
  appSetting: PropsAppSetting;
  selectedSerVer: string;
};

type PropsHook = {
  state: PropsState;
  setState: React.Dispatch<React.SetStateAction<PropsState>>;
};

export const hook = {} as PropsHook;
export let store = {} as PropsStore;

export function UpdateHook() {
  store = React.useContext(storeContext);

  const [state, setState] = React.useState<PropsState>({
    appSetting: { ...store.state.appSetting },
    selectedSerVer: store.state.appSetting.loginMode,
  });

  state.appSetting.server = { ...state.appSetting.server };

  hook.state = state;
  hook.setState = setState;
}

export type TYPE_SUPPORT_NSX = 'ĐL Hà Nội' | 'NPC' | 'CMIS';

export const listSelectServer: TYPE_SUPPORT_NSX[] = [
  'ĐL Hà Nội',
  'NPC',
  // 'CMIS',
];

export async function onInit() {}

export function onDeInit() {}
