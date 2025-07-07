import { Alert } from 'react-native';
import { connectLatestBLE } from '../../service/hhu/bleHhuFunc';
import { ObjSend } from '../../service/hhu/hhuFunc';
import BleManager from 'react-native-ble-manager';
import { showToast } from '../../util';
import { navigation, store } from './controller';
import { navigationRef } from '../../navigation/StackRootNavigator';
export async function onBlePress() {
  // if (store.state.hhu.connected === 'BLE') {

  if (store?.state.hhu.connect === 'DISCONNECTED') {
    try {
      connectLatestBLE(store);
    } catch {}
  } else if (store?.state.hhu.connect === 'CONNECTING') {
  } else {
    Alert.alert(
      'Ngắt bluetooth ?',
      'Bạn có muốn ngắt kết nối thiết bị bluetooth ?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Ngắt kết nối',
          onPress: async () => {
            let peripheral = ObjSend.id;
            if (!ObjSend.id) {
              const peripheralConnected =
                await BleManager.getConnectedPeripherals();
              //console.log('getPeripheral Connected: ', peripheralConnected);
              peripheral = peripheralConnected[0].id;
              //console.log(peripheral);
            }
            console.log(peripheral);
            if(peripheral)
            await BleManager.disconnect(peripheral, true);
            //showToast('Ngắt kết nối bluetoth ' + peripheral);
          },
        },
      ],
    );
  }
  // }
}

export function onBleLongPress() {
  //if (store.state.typeConnect === 'BLE') {
    navigationRef.navigate('BleScreen');
  //}
}
