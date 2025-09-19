import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconFA from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';

import { Colors } from '../../theme';
import {
  GetHookProps,
  PropsItemBle,
  hookProps,
  store,
  onInit,
  onDeInit
} from './controller';
import { connectHandle, disConnect, onScanPress } from './handleButton';
import { StackRootParamsList } from '../../navigation/model/model';

// component hiển thị từng thiết bị
const BleItem = (props: PropsItemBle & { statusLabel?: string }) => {
  const isConnected = props.id === store?.state.hhu.idConnected;

  return (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        isConnected && { borderLeftColor: '#4CAF50', borderLeftWidth: 4 }
      ]}
      onPress={() => connectHandle(props.id, props.name)}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconCircle,
          isConnected
            ? { backgroundColor: '#4CAF50' }
            : { backgroundColor: Colors.primary }
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
        {props.statusLabel && (
          <Text
            style={[
              styles.deviceStatus,
              { color: isConnected ? '#4CAF50' : '#999' }
            ]}
          >
            {props.statusLabel}
          </Text>
        )}
      </View>

      {/* RSSI */}
      {props.rssi !== undefined && (
        <View style={styles.rssiContainer}>
          <MCIcon
            name={
              props.rssi > -60
                ? 'signal-cellular-3'
                : props.rssi > -80
                ? 'signal-cellular-2'
                : 'signal-cellular-1'
            }
            size={18}
            color="#007bff"
          />
          <Text style={styles.rssiText}>{props.rssi} dBm</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// màn hình chính
export const SetUpBleScreen = () => {
  GetHookProps();
  const navigation = useNavigation<StackNavigationProp<StackRootParamsList>>();

  useEffect(() => {
    onInit(navigation);
    onScanPress();
    return () => onDeInit();
  }, []);

  return (
    <LinearGradient
      colors={['#f9fbfd', '#eef3f7']}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconFA name="bluetooth-b" size={20} color="#007bff" />
        <Text style={styles.headerTitle}>Quản lý thiết bị BLE</Text>
        {hookProps.state.ble.isScan && (
          <ActivityIndicator size="small" color="#007bff" style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Dashboard */}
      <View style={styles.dashboard}>
        {[
          {
            label: 'Đang kết nối',
            value: store.state.hhu.connect === 'CONNECTED' ? 1 : 0,
            color: '#4CAF50',
            icon: 'link-variant'
          },
          {
            label: 'Mới quét',
            value: hookProps.state.ble.listNewDevice.length,
            color: '#007bff',
            icon: 'radar'
          },
          {
            label: 'Đã từng',
            value: hookProps.state.ble.listBondedDevice.length,
            color: '#ff9800',
            icon: 'history'
          }
        ].map((item, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: item.color }]}>
            <MCIcon name={item.icon} size={20} color="#fff" />
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
      >
        {/* Đang kết nối */}
        {store.state.hhu.connect === 'CONNECTED' && (
          <>
            <Text style={styles.sectionTitle}>🔗 Đang kết nối</Text>
            <BleItem
              id={store.state.hhu.idConnected as string}
              name={store.state.hhu.name as string}
              rssi={store.state.hhu.rssi === 0 ? undefined : store.state.hhu.rssi}
              statusLabel="Kết nối thành công"
            />
          </>
        )}

        {/* Thiết bị mới */}
        <Text style={styles.sectionTitle}>
          📡 Thiết bị khả dụng: {hookProps.state.status}
        </Text>
        {hookProps.state.ble.listNewDevice.length > 0 ? (
          hookProps.state.ble.listNewDevice.map((item) => (
            <BleItem
              key={item.id}
              id={item.id}
              name={item.name}
              rssi={item.rssi}
              statusLabel="Chưa kết nối"
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Không tìm thấy thiết bị mới</Text>
        )}

        {/* Thiết bị đã từng kết nối */}
        {hookProps.state.ble.listBondedDevice?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🕘 Thiết bị đã từng kết nối</Text>
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

      {/* FAB */}
      {store.state.hhu.connect === 'CONNECTED' && (
        <TouchableOpacity
          onPress={() => disConnect(store.state.hhu.idConnected)}
          style={[styles.fab, { bottom: 90, backgroundColor: '#d9534f' }]}
        >
          <Icon5 name="unlink" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onScanPress} style={styles.fab}>
        {hookProps.state.ble.isScan ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <IconAnt name="search1" size={22} color="#fff" />
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    elevation: 2
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4
  },
  cardLabel: {
    fontSize: 12,
    color: '#fff'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    paddingLeft: 6
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
