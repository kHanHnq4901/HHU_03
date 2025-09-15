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
  currentTime: string;
  impData: number;
  expData: number;
  event: string;
  batteryLevel: string;
  latchPeriod: string;
};

export type PropHistoryDataMeter = {
  serial: string;
  dataRecords: {
    timestamp: string; // ISO hoặc HH:mm
    value: number;
  }[];
};

export type HookState = {
  serial: string;
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
    serial: "1234567890",
    isDetailedRead: false,
    meterData: null,
    historyData: null, // ✅ thêm state cho history
    isLoading: false,
    isReading: false,
    textLoading: "Đang đọc dữ liệu...",
  });

  store = useContext(storeContext) as PropsStore;

  // Gắn global cho hookProps để file khác có thể gọi được
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
