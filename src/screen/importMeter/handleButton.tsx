import {
  ObjSend,
  readVersion,
  resetBoard,
  setNameHHU,
  TYPE_HHU_CMD,
} from '../../service/hhu/hhuFunc';
import { hookProps, store } from './controller';

import { GetLineAccount, GetMeterAccount, GetMeterByLine, SaveMeterDataToDB } from '../../service/api/serverData';
import { Alert } from 'react-native';
import { checkTabelDBIfExist, getDBConnection } from '../../database/repository';
import { TABLE_NAME_INFO_LINE, TABLE_NAME_INFO_METER, TABLE_NAME_METER_DATA, TABLE_NAME_METER_HISTORY } from '../../database/entity';

const TAG = 'handle Btn boardBLE:';
export const handleGetData = async () => {
  hookProps.setState(prev => ({ ...prev, isLoading: true ,textLoading:'Đang tải dữ liệu' }));
  const data = await handleGetLineFromServer();

  if (!data) return;
  const dataWithMeterCount = await Promise.all(
    data.map(async (line: any) => {
      const meters = await handleGetMeterByLineFromServer(line.LINE_ID);
      console.log (meters)
      return {
        ...line,
        countMeter: meters.length, // ✅ thêm số lượng meter
      };
    })
  );

  hookProps.setState(prev => ({
    ...prev,
    dataListLine: dataWithMeterCount || [],
    selectedItems: new Set(), // reset chọn
  }));
  console.log (dataWithMeterCount)
  hookProps.setState(prev => ({ ...prev, isLoading: false }));
};
export const toggleSelectAll = (filteredList: any[]) => {
  hookProps.setState(prev => ({
    ...prev,
    selectedItems:
      prev.selectedItems.size === filteredList.length
        ? new Set()
        : new Set(filteredList.map((_, idx) => idx)),
  }));
};

export const toggleItem = (index: number) => {
  hookProps.setState(prev => {
    const updated = new Set(prev.selectedItems);
    updated.has(index) ? updated.delete(index) : updated.add(index);
    return { ...prev, selectedItems: updated };
  });
};

// filteredList -> mình viết thành function để gọi trong component
export const getFilteredList = () => {
  return hookProps.state.dataListLine.filter((item: any) =>
    item.LINE_ID?.toLowerCase().includes(hookProps.state.searchText.toLowerCase()) ||
    item.LINE_NAME?.toLowerCase().includes(hookProps.state.searchText.toLowerCase())
  );
};

export const handleGetDataFromServer = async () => {
  const res = await GetMeterAccount({
    userID: store?.state.infoUser.moreInfoUser.userId,
    token: store?.state.infoUser.moreInfoUser.token,
  });

  if (res.bSucceed && Array.isArray(res.obj)) {
    console.log('📌 Nhận được danh sách:', res.obj);
    return res.obj; // ✅ trả về dữ liệu để setDataList
  } else {
    console.log('❌ Không nhận được dữ liệu hợp lệ');
    return []; // ✅ trả về mảng rỗng thay vì undefined
  }
};
export const handleGetLineFromServer = async () => {
  const res = await GetLineAccount({
    userID: store?.state.infoUser.moreInfoUser.userId,
    token: store?.state.infoUser.moreInfoUser.token,
  });

  if (res.bSucceed && Array.isArray(res.obj)) {
    console.log('📌 Nhận được danh sách:', res.obj);
    return res.obj; // ✅ trả về dữ liệu để setDataList
  } else {
    console.log('❌ Không nhận được dữ liệu hợp lệ');
    return []; // ✅ trả về mảng rỗng thay vì undefined
  }
};

export const handleGetMeterByLineFromServer = async (lineID: string) => {
  const res = await GetMeterByLine({
    lineID: lineID, 
    token: store?.state.infoUser.moreInfoUser.token,
  });

  if (res.bSucceed && Array.isArray(res.obj)) {
    console.log('📌 Nhận được danh sách:', res.obj);
    return res.obj; 
  } else {
    console.log('❌ Không nhận được dữ liệu hợp lệ');
    return []; 
  }
};

export const handleSaveDataToDB = async () => {
  if (hookProps.state.selectedItems.size === 0) {
    Alert.alert("Thông Báo", "⚠️ Không có dữ liệu để lưu");
    return;
  }

  // Lấy danh sách trạm đã chọn (theo index trong dataListLine)
  const selectedData = hookProps.state.dataListLine.filter(
    (_: any, index: number) => hookProps.state.selectedItems.has(index)
  );

  Alert.alert(
    "Xác nhận",
    `Bạn có muốn lưu dữ liệu ${selectedData.length} trạm đã chọn vào Database không?`,
    [
      { text: "Huỷ", style: "cancel" },

      // === APPEND MODE ===
      {
        text: "Thêm điểm thiếu",
        onPress: async () => {
          try {
            hookProps.setState(prev => ({
              ...prev,
              isLoading: true,
              textLoading: "Đang nhập dữ liệu",
            }));

            let successCount = 0;
            let failCount = 0;

            for (const item of selectedData) {
              const result = await SaveMeterDataToDB(item, { mode: "append" });
              if (result) {
                console.log("✅ Append thành công:", item.LINE_ID);
                successCount++;
              } else {
                console.warn("❌ Append thất bại:", item.LINE_ID);
                failCount++;
              }
            }

            hookProps.setState(prev => ({ ...prev, isLoading: false }));

            if (failCount === 0) {
              Alert.alert("Thông báo", `✅ Đã thêm thành công ${successCount} điểm thiếu.`);
            } else {
              Alert.alert(
                "Thông báo",
                `⚠️ Hoàn thành với lỗi.\n✅ Thành công: ${successCount}\n❌ Thất bại: ${failCount}`
              );
            }
          } catch (error) {
            console.error("❌ Lỗi lưu DB (append):", error);
            hookProps.setState(prev => ({ ...prev, isLoading: false }));
            Alert.alert("Thông báo", "❌ Lỗi khi thêm dữ liệu");
          }
        },
      },
      {
        text: "Thay thế toàn bộ",
        onPress: async () => {
          try {
            hookProps.setState(prev => ({
              ...prev,
              isLoading: true,
              textLoading: "Đang nhập dữ liệu",
            }));

            const db = await getDBConnection();
            if (!db) return;

            await checkTabelDBIfExist();
            await db.executeSql(`DELETE FROM ${TABLE_NAME_INFO_LINE}`);
            await db.executeSql(`DELETE FROM ${TABLE_NAME_INFO_METER}`);
            await db.executeSql(`DELETE FROM ${TABLE_NAME_METER_DATA}`);
            await db.executeSql(`DELETE FROM ${TABLE_NAME_METER_HISTORY}`);
            let successCount = 0;
            let failCount = 0;

            for (const item of selectedData) {
              const result = await SaveMeterDataToDB(item, { mode: "replace" });
              if (result) {
                console.log("✅ Replace thành công:", item.LINE_ID);
                successCount++;
              } else {
                console.warn("❌ Replace thất bại:", item.LINE_ID);
                failCount++;
              }
            }

            hookProps.setState(prev => ({ ...prev, isLoading: false }));

            if (failCount === 0) {
              Alert.alert("Thông báo", `✅ Đã thay thế toàn bộ dữ liệu (${successCount}) thành công.`);
            } else {
              Alert.alert(
                "Thông báo",
                `⚠️ Hoàn thành với lỗi.\n✅ Thành công: ${successCount}\n❌ Thất bại: ${failCount}`
              );
            }
          } catch (error) {
            console.error("❌ Lỗi lưu DB (replace):", error);
            hookProps.setState(prev => ({ ...prev, isLoading: false }));
            Alert.alert("Thông báo", "❌ Lỗi khi thay thế dữ liệu");
          }
        },
      },
    ]
  );
};





