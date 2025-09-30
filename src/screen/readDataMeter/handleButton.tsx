
import { Alert } from "react-native";
import { hookProps } from "./controller"; 
import { store } from "../overview/controller";
import { checkPeripheralConnection, send } from "../../util/ble";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { addBleListener, removeBleListener } from "../../service/hhu/ble";
import { resetState } from "../../service/hhu/hhuState";
import { createHhuHandler } from "../../service/hhu/hhuHandler";

const handler = createHhuHandler(hookProps);
let initialTimeout: NodeJS.Timeout | null = null;
let initialSendRetryCount = 0;

export const onReadData = async () => {
  if (!hookProps.state.serial || hookProps.state.serial.length !== 10) {
    Alert.alert("Thông báo", "Vui lòng điền serial đủ 10 ký tự");
    return;
  }
  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return;

  // reset app/hhu state
  resetState();
  removeBleListener();

  // prepare handler internal state + UI
  handler.prepareForRead();

  addBleListener(async (data) => {
    if (handler._internal.hasFinished()) return;
    // push to global queue if needed
    // hhuState.dataQueue.push(data); // optional
    await handler.hhuHandleReceiveData(data);
  });

  const requestData = buildQueryDataPacket(hookProps.state.serial, 1, hookProps.state.isDetailedRead);

  const initialRetryLoop = async () => {
    if (handler._internal.hasFinished() || handler._internal.hasReceivedAnyPacket()) return;
    initialSendRetryCount++;
    console.warn(`⚠️ Gửi lại gói 1 - lần ${initialSendRetryCount}`);
    try {
      await send(store.state.hhu.idConnected, requestData);
      hookProps.setState((prev: any) => ({ ...prev, textLoading: `Đang đọc dữ liệu... lần ${initialSendRetryCount}` }));
    } catch (err) {
      console.error("❌ Lỗi khi gửi gói 1 (retry):", err);
    }

    if (!handler._internal.hasReceivedAnyPacket() && initialSendRetryCount >= handler.getMaxRetry()) {
      Alert.alert("Thông báo", "Không nhận được dữ liệu từ đồng hồ sau nhiều lần thử. Vui lòng thử lại.");
      initialSendRetryCount = 0
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
    handler.cleanup();
    return;
  }

  if (initialTimeout) clearTimeout(initialTimeout);
  initialTimeout = setTimeout(initialRetryLoop, 1000);
};

export const stopReadData = () => {
  handler.cleanup();
};
