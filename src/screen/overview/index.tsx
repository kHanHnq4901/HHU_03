import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Theme, { normalize } from '../../theme';
import { CircleSnail } from 'react-native-progress';
import { onBleLongPress, onBlePress } from '../../component/header/handleButton';
import { GetHookProps, store } from '../login/controller';
import { onDeInit, onInit } from '../../component/drawer/drawerContent/controller';
const deviceWidth = Dimensions.get('window').width;
const itemSize = deviceWidth / 3 - 20;

const MENU_ITEMS = [
  { label: 'Đọc bán tự động', icon: 'file-document-outline', subtitle: 'Còn 123 đồng hồ', screen: 'ManualRead', color: '#3F51B5' },
  { label: 'Đọc tự động', icon: 'robot-outline', subtitle: '2 thiết bị đang chạy', screen: 'AutomaticRead', color: '#009688' },
  { label: 'Đồng bộ', icon: 'sync', subtitle: 'Lần cuối: 10:30 06/08', screen: 'SyncScreen', color: '#4CAF50' },
  { label: 'Thống kê', icon: 'chart-bar', subtitle: 'Xem báo cáo', screen: 'Statistics', color: '#FF9800' },
  { label: 'Cài đặt', icon: 'cog-outline', subtitle: 'Thiết lập hệ thống', screen: 'Settings', color: '#8E24AA' },
  { label: 'Thiết bị cầm tay', icon: 'cellphone-link', subtitle: '2 thiết bị kết nối', screen: 'BoardBLE', color: '#E91E63' },
  { label: 'Cấu hình', icon: 'tune', subtitle: 'Chỉnh thông số', screen: 'ConfigMeter', color: '#03A9F4' },
  { label: 'Hướng dẫn', icon: 'book-open-page-variant', subtitle: 'Xem cách sử dụng', screen: 'UserGuide', color: '#00BCD4' },
  { label: 'Đăng xuất', icon: 'logout', subtitle: 'Thoát hệ thống', screen: 'Login', color: '#FF5722', isLogout: true },
  { label: 'Thoát', icon: 'exit-to-app', subtitle: '', color: '#795548', isExit: true },
];

export const OverViewScreen = () => {
  const navigation = useNavigation();
  const handlePress = (item: any) => {
    if (item.isExit) {
      Alert.alert('Thoát', 'Bạn có muốn thoát ứng dụng ?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'OK', onPress: () => BackHandler.exitApp() },
      ]);
    } else if (item.isLogout) {
      Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất ?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } else if (item.screen) {
      // @ts-ignore
      navigation.navigate(item.screen);
    }
  };
  React.useEffect(() => {
    onInit(navigation);

    return () => {
      onDeInit();
    };
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.bleIconContainer}>
        <TouchableOpacity
          onLongPress={() => {
            // headerData.reserverTitle = title; // nếu cần
            onBleLongPress();
          }}
          onPress={onBlePress}
          style={styles.bleButton}
        >
          {store?.state.hhu.connect === 'CONNECTING' ? (
            <CircleSnail
              color={['red', 'green', 'blue']}
              size={28}
              indeterminate
              thickness={1}
            />
          ) : (
            <MaterialCommunityIcons
              name={
                store?.state.hhu.connect === 'CONNECTED'
                  ? 'bluetooth-connect'
                  : 'bluetooth-off'
              }
              size={28}
              color={
                store?.state.hhu.connect === 'CONNECTED'
                  ? '#5fe321'
                  : 'black'
              }
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handlePress(item)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Icon name={item.icon} size={34} color="#fff" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    paddingTop: 10,
  },
  bleIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  bleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingTop: 60, // Đẩy xuống dưới icon BLE
  },
  card: {
    width: itemSize,
    height: itemSize + 25,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuLabel: {
    textAlign: 'center',
    fontSize: normalize(14),
    color: '#333',
    fontWeight: '600',
  },
  menuSubtitle: {
    textAlign: 'center',
    fontSize: normalize(11),
    color: '#888',
    marginTop: 4,
  },
});
