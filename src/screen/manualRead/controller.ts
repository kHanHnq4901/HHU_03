import { useContext, useEffect, useState, useMemo } from "react";
import { Alert } from "react-native";
import { PropsLineModel, PropsMeterDataModel, PropsMeterModel, TABLE_NAME_INFO_LINE, TABLE_NAME_INFO_METER, TABLE_NAME_METER_DATA } from "../../database/entity";
import { checkTabelDBIfExist, getDBConnection } from "../../database/repository";
import { PropsStore, storeContext } from "../../store";
import { getDistanceValue } from "../../util/location";

export const hookProps = {} as HookProps;
export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};
export let store = {} as PropsStore;
type PropsReadingStatus = {
  meterNo: string;
  name: string;
  status: "reading" | "success" | "fail";
} | null;
export type PropDataMeter = {
  serial: string;
  currentTime: Date | null;
  impData: number;        
  expData: number;        
  event: string;
  batteryLevel: string;  
  latchPeriod: string;
  
  dataRecords: {
    timestamp: Date | null;  // thời gian (ISO hoặc HH:mm)
    value: number;      // chỉ số tương ứng
  }[];
};
// Thêm selectedStatus vào state nếu muốn lưu global
export type HookState = {
  readingStatus : PropsReadingStatus; 
  currentLocation: number[];
  searchText: string;
  isLoading: boolean;
  isAutoReading: boolean;
  textLoading: string;
  listMeter: PropsMeterModel[];
  filteredMeters: PropsMeterModel[];
  selectedStatus?: number;
  modalVisible : boolean;
  meterData: PropDataMeter | null; 
};

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    readingStatus : null,
    currentLocation: [105.834160, 21.027763],
    searchText: "",
    isLoading: false,
    isAutoReading: false,
    textLoading: "",
    listMeter: [],
    filteredMeters : [],
    selectedStatus: undefined,
    modalVisible : false,
    meterData: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await getDBConnection();
        if (!db) return;

        await checkTabelDBIfExist();

        const meterResults = await db.executeSql(`SELECT * FROM ${TABLE_NAME_INFO_METER}`);
        const listMeter = meterResults[0].rows.raw() as PropsMeterModel[];


        setState((prev) => ({
          ...prev,
          listMeter,
        }));
      } catch (error) {
        console.error("❌ Lỗi khi load dữ liệu:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu từ database.");
      }
    };

    fetchData();
  }, []);

  store = useContext(storeContext) as PropsStore;

  // Gắn global cho hookProps
  hookProps.state = { ...state };
  hookProps.setState = setState;

  return hookProps;
};

