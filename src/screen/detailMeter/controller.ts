import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  PropsHistoryMeterDataModel,
  PropsMeterDataModel,
  TABLE_NAME_METER_DATA,
  TABLE_NAME_METER_HISTORY,
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
  meterData: PropsMeterDataModel | null; // ✅ bản ghi mới nhất
  historyData: PropsHistoryMeterDataModel[]; // ✅ toàn bộ bản ghi trong HISTORY
};

export const useHookProps = (meterNo: string): HookProps => {
  const [state, setState] = useState<HookState>({
    searchText: "",
    isLoading: false,
    textLoading: "",
    meterData: null,
    historyData: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          textLoading: "Đang tải dữ liệu...",
        }));

        const db = await getDBConnection();
        if (!db) return;

        await checkTabelDBIfExist();

        // 🔥 Query bảng METER_DATA (chỉ lấy 1 bản ghi mới nhất)
        const dataResults = await db.executeSql(
          `SELECT * FROM ${TABLE_NAME_METER_DATA} WHERE METER_NO = ? ORDER BY TIMESTAMP DESC LIMIT 1`,
          [meterNo]
        );

        // 🔥 Query toàn bộ HISTORY (sắp xếp mới → cũ)
        const historyResults = await db.executeSql(
          `SELECT * FROM ${TABLE_NAME_METER_HISTORY} WHERE METER_NO = ? ORDER BY TIMESTAMP DESC`,
          [meterNo]
        );

        const data = dataResults[0].rows.raw() as PropsMeterDataModel[];
        const history = historyResults[0].rows.raw() as PropsHistoryMeterDataModel[];

        setState((prev) => ({
          ...prev,
          meterData: data.length > 0 ? data[0] : null,
          historyData: history,
          isLoading: false,
          textLoading: "",
        }));
      } catch (error) {
        console.error("❌ Lỗi khi load dữ liệu:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu từ database.");
        setState((prev) => ({
          ...prev,
          isLoading: false,
          textLoading: "",
        }));
      }
    };

    if (meterNo) fetchData();
  }, [meterNo]);

  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
