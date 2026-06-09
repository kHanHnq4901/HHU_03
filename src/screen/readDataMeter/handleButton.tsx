
import { Alert } from "react-native";
import { hookProps } from "./controller"; 
import { store } from "../overview/controller";
import { checkPeripheralConnection, send } from "../../util/ble";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { addBleListener, removeBleListener } from "../../service/hhu/ble";
import { resetState } from "../../service/hhu/hhuState";
import { createHhuHandler } from "../../service/hhu/hhuHandler";
import { crc16 } from "../../util/crc16";
import BleManager from 'react-native-ble-manager';

const handler = createHhuHandler(hookProps);
let initialTimeout: NodeJS.Timeout | null = null;
let initialSendRetryCount = 0;
let service: string ;
let characteristic: string;
export const onReadData = async () => {
  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return;

  // Reset các thống kê
  hookProps.setState((prev) => ({
    ...prev,
    textLoading: '',
  }));

  resetState();
  removeBleListener();

  handler.prepareForRead();

  addBleListener(async (data) => {
    if (handler._internal.hasFinished()) return;
    await handler.hhuHandleReceiveData(data);
  });

  const requestData = buildQueryDataPacket(
    hookProps.state.serial,
    1,
    hookProps.state.isDetailedRead
  );

  let retryCount = 0;

const initialRetryLoop = async () => {
  // Nếu đã nhận gói dữ liệu thành công hoặc hoàn tất → không retry
  if (handler._internal.hasFinished() || handler._internal.hasReceivedAnyPacket()) return;

  try {
     retryCount++;
    console.warn(`⚠️ Gửi lại gói 1 - lần ${retryCount}`);

    await send(store.state.hhu.idConnected, requestData);

    // Cập nhật text loading theo lần retry
    hookProps.setState((prev) => ({
      ...prev,
      textLoading: `Đang đọc dữ liệu... lần ${retryCount}`,
    }));

    // Nếu sau khi gửi mà vẫn chưa nhận được gói nào → tăng noResponse
    if (!handler._internal.hasReceivedAnyPacket()) {
      hookProps.setState((prev) => ({
        ...prev,
        noResponse: prev.noResponse + 1,
      }));
    }
  } catch (err) {
    console.error("❌ Lỗi khi gửi gói 1 (retry):", err);

    // Chỉ tăng failCount khi gửi thất bại
    hookProps.setState((prev) => ({
      ...prev,
      failCount: prev.failCount + 1,
    }));
  }

  // Kiểm tra đã vượt quá số lần retry
  if (!handler._internal.hasReceivedAnyPacket() && retryCount >= handler.getMaxRetry()) {
    Alert.alert(
      "Thông báo",
      "Không nhận được dữ liệu từ đồng hồ sau nhiều lần thử. Vui lòng thử lại."
    );
    retryCount = 0;
    handler.cleanup();
    return;
  }

  if (initialTimeout) clearTimeout(initialTimeout);
  initialTimeout = setTimeout(initialRetryLoop, 1000);
};


  try {
    await send(store.state.hhu.idConnected, requestData);
    console.log("🚀 Gửi gói 1 lần đầu xong");
  } catch (err) {
    console.error("❌ Lỗi khi gửi lần đầu:", err);
    hookProps.setState((prev) => ({
      ...prev,
      failCount: prev.failCount + 1,
      noResponse: prev.noResponse + 1,
    }));
    handler.cleanup();
    return;
  }

  if (initialTimeout) clearTimeout(initialTimeout);
  initialTimeout = setTimeout(initialRetryLoop, 1000);
};
// export const send = async (idPeripheral: string, data: number[]) => {
//   try {
//     const START = 0xAA;
//     const COMMAND = 0x00;
//     const LENGTH = data.length;
//     const lengthLow = LENGTH & 0xff;
//     const lengthHigh = (LENGTH >> 8) & 0xff;
//     const baseData = [START,COMMAND, lengthLow,lengthHigh, ...data];
//     const buf = Buffer.from(baseData);
//     const crc = crc16(buf, buf.length);
//     const OKE_BYTES = [0x4F, 0x4B, 0x45];
//     const fullFrame = [...baseData,crc & 0xff,(crc >> 8) & 0xff,...OKE_BYTES];
//     console.log ("fullFrame" + fullFrame)
//     await BleManager.write(idPeripheral, service, characteristic, fullFrame,256);
//   } catch (err: any) {
//     console.log(TAG + 'Error sending:', err);
//   }
// };

export const stopReadData = () => {
  handler.cleanup();
};
