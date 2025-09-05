import { useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { PropsLineModel, PropsMeterDataModel, PropsMeterModel, TABLE_NAME_INFO_LINE, TABLE_NAME_INFO_METER, TABLE_NAME_METER_DATA } from "../../database/entity";
import { checkTabelDBIfExist, getDBConnection } from "../../database/repository";
import { PropsStore, storeContext } from "../../store";

export const hookProps = {} as HookProps;
export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};
export type PropDataMeter = {
  serial: string;
  currentTime: string;
  impData: number;        
  expData: number;        
  event: string;
  batteryLevel: string;  
  latchPeriod: string;
  dataRecords: {
    timestamp: string;  // thời gian (ISO hoặc HH:mm)
    value: number;      // chỉ số tương ứng
  }[];
};

export type HookState = {
  serial: string;
  isDetailedRead: boolean;
  meterData: PropDataMeter | null;  // có thể null
  isLoading: boolean;
  isAutoReading: boolean;
  textLoading: string;
};

export let store = {} as PropsStore;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    serial : "1234567890" , 
    isDetailedRead : false,
    meterData: null,
    isLoading: false,
    isAutoReading : false,
    textLoading: '',
  });

  store = useContext(storeContext) as PropsStore;

  // Gắn global cho hookProps
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

