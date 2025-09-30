import { useContext, useEffect, useState } from "react";
import { PropsStore, storeContext } from "../../store";
import { getDBConnection } from "../../database/repository";

export const hookProps = {} as HookProps;

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

export type PropDataMeter = {
  serial: string;
  currentTime: Date | null ;
  impData: number;
  expData: number;
  event: string;
  batteryLevel: string;
  latchPeriod: string;
  totalPacket : number;
};

export type PropHistoryDataMeter = {
  serial: string;
  dataRecords: {
    timestamp: Date;
    value: number;
  }[];
};

export type HookState = {
  serial: string;
  currentTime: Date | null ;
  isDetailedRead: boolean;
  meterData: PropDataMeter | null;       // Header (1 dòng duy nhất)
  historyData: PropHistoryDataMeter | null; // Toàn bộ dataRecords
  isLoading: boolean;
  isReading: boolean;
  textLoading: string;
};

export let store = {} as PropsStore;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    serial: "",
    currentTime : null,
    isDetailedRead: false,
    meterData: null,
    historyData: null, // ✅ thêm state cho history
    isLoading: false,
    isReading: false,
    textLoading: "Đang đọc dữ liệu",
  });

  store = useContext(storeContext) as PropsStore;

  // Gắn global cho hookProps để file khác có thể gọi được
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
