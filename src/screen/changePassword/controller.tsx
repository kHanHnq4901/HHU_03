import React, { useState } from 'react';

export type HookState = {};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = ' Controller: ';

export const hookProps = {} as HookProps;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    xmlList: [],
  });
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

export const onInit = async () => {};

export const onDeInit = () => {};
