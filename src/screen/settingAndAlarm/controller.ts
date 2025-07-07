import React, { useState } from 'react';
import { PropsStore, storeContext } from '../../store';

type PropsHookState = {
  typeAlarm: PropsTypeAlarmRegister;
  showAdvanced: boolean;
  isBusy: boolean;
  showModalEnterPass: boolean;
};

type PropsHook = {
  state: PropsHookState;
  setState: React.Dispatch<React.SetStateAction<PropsHookState>>;
};

type PropsTypeAlarmRegister = 'Giá trị (kWh)' | 'Phần trăm (%)';

type PropsValueAlarmRegister = 'Percent' | 'Value';

export const typeAlarmRegister: {
  title: PropsTypeAlarmRegister;
  value: PropsValueAlarmRegister;
}[] = [
  {
    title: 'Giá trị (kWh)',
    value: 'Value',
  },
  {
    title: 'Phần trăm (%)',
    value: 'Percent',
  },
];

export const hookProps = {} as PropsHook;
export let store = {} as PropsStore;

export const GetHookProps = (): PropsHook => {
  const [state, setState] = useState<PropsHookState>({
    typeAlarm: 'Giá trị (kWh)',
    showAdvanced: false,
    isBusy: false,
    showModalEnterPass: false,
  });
  hookProps.state = state;
  hookProps.setState = setState;

  store = React.useContext(storeContext);

  return hookProps;
};
