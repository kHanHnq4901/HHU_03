import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  PropsMeterModel,
  TABLE_NAME_INFO_METER,
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
  listMeter: PropsMeterModel[];
};

export const useHookProps = (lineId?: string): HookProps => {
  const [state, setState] = useState<HookState>({
    searchText: "",
    isLoading: false,
    textLoading: "",
    listMeter: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!lineId) return; // ✅ tránh query khi chưa có lineId

      try {
        const db = await getDBConnection();
        if (!db) return;

        await checkTabelDBIfExist();

        // ✅ Query trực tiếp với WHERE LINE_ID
        const meterResults = await db.executeSql(
          `SELECT * FROM ${TABLE_NAME_INFO_METER} WHERE LINE_ID = ?`,
          [lineId]
        );

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
  }, [lineId]); // ✅ chạy lại khi lineId thay đổi

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
