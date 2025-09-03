import { Alert } from "react-native";
import { hookProps } from "./controller";
import { LoraCommandCode } from "../../service/hhu/defineEM";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { store } from "../overview/controller";
import { send } from "../../util/ble";

export const onReadData = async () => {
  try {
    if (!hookProps.state.serial) {
      Alert.alert('Vui lòng điền serial');
      return;
    }
    const data = buildQueryDataPacket(hookProps.state.serial);
    console.log('📤 Data gửi:', data);

    await send(store.state.hhu.idConnected, data);

    console.log('📥 Đọc cấu hình thành công');
  } catch (error) {
    console.error('❌ Lỗi khi đọc cấu hình:', error);
  }
};
