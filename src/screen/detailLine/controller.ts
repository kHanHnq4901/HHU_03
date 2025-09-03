import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  PropsLineModel,
  PropsMeterDataModel,
  PropsMeterModel,
  TABLE_NAME_INFO_LINE,
  TABLE_NAME_INFO_METER,
  TABLE_NAME_METER_DATA,
} from "../../database/entity";
import { checkTabelDBIfExist, getDBConnection } from "../../database/repository";

export const hookProps = {} as HookProps;

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

type HookState = {
  searchText: string;
  isLoading: boolean;
  textLoading: string;
  listLine: PropsLineModel[];
  listMeter: PropsMeterModel[];
  dataMeter: PropsMeterDataModel[];
};

export const useHookProps = (): HookProps => {
  // ✅ sửa lại kiểu của state
  const [state, setState] = useState<HookState>({
    searchText: "",
    isLoading: false,
    textLoading: "",
    listLine: [],
    listMeter: [],
    dataMeter: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await getDBConnection();
        if (!db) return;

        await checkTabelDBIfExist();

        const lineResults = await db.executeSql(
          "SELECT * FROM " + TABLE_NAME_INFO_LINE
        );
        const listLine = lineResults[0].rows.raw() as PropsLineModel[];

        const meterResults = await db.executeSql(
          "SELECT * FROM " + TABLE_NAME_INFO_METER
        );
        const listMeter = meterResults[0].rows.raw() as PropsMeterModel[];

        const dataResults = await db.executeSql(
          "SELECT * FROM " + TABLE_NAME_METER_DATA
        );
        const dataMeter = dataResults[0].rows.raw() as PropsMeterDataModel[];

        setState((prev) => ({
          ...prev,
          listLine,
          listMeter,
          dataMeter,
        }));
      } catch (error) {
        console.error("❌ Lỗi khi load dữ liệu:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu từ database.");
      }
    };

    fetchData();
  }, []);

  // ✅ Gắn global cho hookProps
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
