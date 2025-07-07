import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { DrawerNavigationProps, StackRootNavigationProp } from '../../navigation/model/model';
import { PropsStore, storeContext } from '../../store';

export type HookState = {};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = ' Controller: ';

export const hookProps = {} as HookProps;
export let store = {} as PropsStore;
export let navigation: DrawerNavigationProps|StackRootNavigationProp;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({});
  hookProps.state = state;
  hookProps.setState = setState;
  store = React.useContext(storeContext) as PropsStore;
  navigation = useNavigation<DrawerNavigationProps|StackRootNavigationProp>();

  return hookProps;
};

export const onInit = async () => {};

export const onDeInit = () => {};
