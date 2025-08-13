import React, { useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconFA from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, normalize } from '../../theme';
import {
  GetHookProps,
  PropsItemBle,
  hookProps,
  store,
  onInit,
  onDeInit
} from './controller';
import { connectHandle, onScanPress } from './handleButton';
import { StackRootParamsList } from '../../navigation/model/model';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  connectLatestBLE,
  handleUpdateValueForCharacteristic as hhuHandleReceiveData,
  initModuleBle,
} from '../../service/hhu/bleHhuFunc';
import { hhuHandleDisconnectedPeripheral } from '../../component/drawer/drawerContent/controller';
import BleManager from 'react-native-ble-manager';
// Component hiển thị từng thiết bị
const BleItem = (props: PropsItemBle & { statusLabel?: string }) => {
  const isConnected = props.id === store?.state.hhu.idConnected;

  return (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        isConnected && { borderLeftColor: '#4CAF50', borderLeftWidth: 4 }
      ]}
      onPress={() => connectHandle(props.id, props.name)} // GỌI KHI ẤN
    >
      {/* Icon */}
      <View
        style={[
          styles.iconCircle,
          isConnected ? { backgroundColor: '#4CAF50' } : { backgroundColor: Colors.primary }
        ]}
      >
        <IconFA name="bluetooth" size={20} color="#fff" />
      </View>

      {/* Thông tin */}
      <View style={{ flex: 1 }}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {props.name || 'Không tên'}
        </Text>
        <Text style={styles.deviceId} numberOfLines={1}>
          ID: {props.id}
        </Text>
      </View>

      {/* RSSI */}
      {props.rssi !== undefined && (
        <View style={styles.rssiContainer}>
          <IconAnt name="wifi" size={16} color="#007bff" />
          <Text style={styles.rssiText}>{props.rssi} dBm</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Màn hình chính
export const SetUpBleScreen = () => {
  GetHookProps();
  const navigation = useNavigation<StackNavigationProp<StackRootParamsList>>();
  useEffect(() => {
    onInit(navigation);
    return () => onDeInit();
  }, []);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
      >
        {/* Đang kết nối */}
        {store.state.hhu.connect === 'CONNECTED' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MCIcon name="link-variant" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Đang kết nối</Text>
            </View>
            <BleItem
              id={store.state.hhu.idConnected as string}
              name={store.state.hhu.name as string}
              rssi={store.state.hhu.rssi === 0 ? undefined : store.state.hhu.rssi}
              statusLabel="Kết nối thành công"
            />
          </>
        )}
        <Text style={styles.sectionTitle}>📡 Thiết bị khả dụng : {hookProps.state.status}</Text>
        {/* Khả dụng */}
        {hookProps.state.ble.listNewDevice.length > 0 && (
          <>

            {hookProps.state.ble.listNewDevice.map((item) => (
              <BleItem
                key={item.id}
                id={item.id}
                name={item.name}
                rssi={item.rssi}
                statusLabel="Chưa kết nối"
              />
            ))}
          </>
        )}

        {/* Đã từng kết nối */}
        {hookProps.state.ble.listBondedDevice?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔗 Thiết bị đã từng kết nối</Text>
            {hookProps.state.ble.listBondedDevice.map((item) => (
              <BleItem
                key={item.id}
                id={item.id}
                name={item.name}
                rssi={item.rssi}
                statusLabel="Đã kết nối trước đây"
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Nút quét nổi */}
      <TouchableOpacity
        onPress={onScanPress}
        style={styles.fab}
      >
        {hookProps.state.ble.isScan ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <IconAnt name="search1" size={22} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text
  },
  deviceId: {
    fontSize: 12,
    color: '#777'
  },
  deviceStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2
  },
  rssiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8
  },
  rssiText: {
    fontSize: 12,
    color: '#007bff',
    marginLeft: 4
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  }
});
