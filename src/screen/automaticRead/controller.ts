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

type HookState = {
  currentLocation: number[] | null;
  searchText: string;
  isLoading: boolean;
  isAutoReading : boolean;
  textLoading: string;
  listLine: PropsLineModel[];
  listMeter: PropsMeterModel[];
  dataMeter: PropsMeterDataModel[];
  statusCount: { [status: number]: number }; 
};

export let store = {} as PropsStore;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    currentLocation: null, 
    searchText: "",
    isLoading: false,
    isAutoReading : false,
    textLoading: '',
    listLine: [],
    listMeter: [],
    dataMeter: [],
    statusCount: {}, // ✅ khởi tạo rỗng
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

        // ✅ Đếm số lượng theo STATUS
        const statusCount: { [status: number]: number } = {};
        listMeter.forEach((item) => {
          const status = (item as any).STATUS ?? 0; // Nếu có cột STATUS
          statusCount[status] = (statusCount[status] || 0) + 1;
        });

        setState((prev) => ({
          ...prev,
          listLine,
          listMeter,
          dataMeter,
          statusCount, // ✅ lưu vào state
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
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

