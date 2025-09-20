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
export type PropDataMeter = {
  serial: string;
  currentTime: Date | null ;
  impData: number;        
  expData: number;        
  event: string;
  batteryLevel: string;  
  latchPeriod: string;
  
  dataRecords: {
    timestamp: Date;  // thời gian (ISO hoặc HH:mm)
    value: number;      // chỉ số tương ứng
  }[];
};
// Thêm selectedStatus vào state nếu muốn lưu global
export type HookState = {
  currentLocation: number[];
  searchText: string;
  isLoading: boolean;
  isAutoReading: boolean;
  textLoading: string;
  listLine: PropsLineModel[];
  listMeter: PropsMeterModel[];
  filteredMeters: PropsMeterModel[];
  dataMeter: PropsMeterDataModel[];
  statusCount: { [status: number]: number };
  selectedStatus?: number;
  modalVisible : boolean;
  readingStatus : PropsReadingStatus; 
  meterData: PropDataMeter | null; 
};
type PropsReadingStatus = {
  meterNo: string;
  name: string;
  status: "reading" | "success" | "fail";
} | null;
export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    currentLocation: [105.834160, 21.027763],
    searchText: "",
    isLoading: false,
    isAutoReading: false,
    textLoading: "",
    listLine: [],
    filteredMeters : [],
    listMeter: [],
    dataMeter: [],
    statusCount: {},
    selectedStatus: undefined,
    modalVisible : false,
    readingStatus : null,
    meterData: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await getDBConnection();
        if (!db) return;

        await checkTabelDBIfExist();

        const lineResults = await db.executeSql("SELECT * FROM " + TABLE_NAME_INFO_LINE);
        const listLine = lineResults[0].rows.raw() as PropsLineModel[];

        const meterResults = await db.executeSql("SELECT * FROM " + TABLE_NAME_INFO_METER);
        const listMeter = meterResults[0].rows.raw() as PropsMeterModel[];

        const dataResults = await db.executeSql("SELECT * FROM " + TABLE_NAME_METER_DATA);
        const dataMeter = dataResults[0].rows.raw() as PropsMeterDataModel[];

        const statusCount: { [status: number]: number } = {};
        listMeter.forEach((item) => {
          const status = (item as any).STATUS ?? 0;
          statusCount[status] = (statusCount[status] || 0) + 1;
        });

        setState((prev) => ({
          ...prev,
          listLine,
          listMeter,
          dataMeter,
          statusCount,
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
  hookProps.state = { ...state }; // thêm filteredMeters vào state trả về
  hookProps.setState = setState;

  return hookProps;
};
