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
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Theme, { normalize } from '../../theme';
import { CircleSnail } from 'react-native-progress';
import { GetHookProps, hookProps, onDeInit, onInit, store } from './controller';
import { onBleLongPress, onBlePress } from './handleButton';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackRootParamsList } from '../../navigation/model/model';
import SyncOverlay from '../../component/syncProgressBar';
import { hook } from '../settingIPportScreen/controller';
import { onSavePress } from './handleButton';

const deviceWidth = Dimensions.get('window').width;
const itemSize = deviceWidth / 3 - 20;

export const OverViewScreen = () => { 
  GetHookProps();
  const navigation = useNavigation<StackNavigationProp<StackRootParamsList>>();

  const [progress, setProgress] = React.useState(0);

  const MENU_ITEMS = [
    { label: 'Đọc bán tự động', icon: 'file-document-outline', subtitle: `Còn ${hookProps?.state?.statusCount[0] || 0} đồng hồ chưa đọc `, screen: 'ManualRead', color: '#3F51B5' },
    { label: 'Đọc tự động', icon: 'robot-outline', subtitle: `Còn ${hookProps?.state?.statusCount[0] || 0} đồng hồ chưa đọc `, screen: 'AutomaticRead', color: '#009688' },
    { label: 'Lấy danh sách đồng hồ', icon: 'water', subtitle: 'Tải dữ liệu từ DB', screen: 'ImportMeter', color: '#2196F3' },
    { label: 'Đồng bộ', icon: 'sync', subtitle: `Lần cuối ${store.state.appSetting.timeSynchronization} `, isSync: true, color: '#4CAF50' },
    { label: 'Thống kê', icon: 'chart-bar', subtitle: 'Xem báo cáo', screen: 'Statistics', color: '#FF9800' },
    { label: 'Cài đặt', icon: 'cog-outline', subtitle: 'Thiết lập hệ thống', screen: 'SettingAndAlarm', color: '#8E24AA' },
    { label: 'Thiết bị cầm tay', icon: 'cellphone-link', subtitle: 'Cấu hình thiết bị HU', screen: 'BoardBLE', color: '#E91E63' },
    { label: 'Cấu hình', icon: 'tune', subtitle: 'Chỉnh thông số', screen: 'ConfigMeter', color: '#03A9F4' },
    { label: 'Đọc dữ liệu', icon: 'database-search', subtitle: 'Xem dữ liệu thô', screen: 'ReadDataMeter', color: '#607D8B' },
    { label: 'Hướng dẫn', icon: 'book-open-page-variant', subtitle: 'Xem cách sử dụng', isGuide: true, color: '#00BCD4' },
    { label: 'Đăng xuất', icon: 'logout', subtitle: 'Thoát hệ thống', screen: 'Login', color: '#FF5722', isLogout: true },
    { label: 'Thoát', icon: 'exit-to-app', subtitle: '', color: '#795548', isExit: true },
  ];

  const onPressItem = (item: any) => {
    if (progress > 0 && progress < 100) return; // 🔒 Khóa mọi thao tác khi đang đồng bộ

    if (item.isLogout) {
      Alert.alert('Thông báo', 'Bạn có muốn đăng xuất ?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (item.isExit) {
      BackHandler.exitApp();
      return;
    }

    if (item.isGuide) {
      Linking.openURL('https://emic.com.vn/');
      return;
    }

    if (item.isSync) {
      setProgress(0);
      let current = 0;
    
      const interval = setInterval(() => {
        current += 1;
        setProgress(current);
    
        if (current >= 100) {
          clearInterval(interval);
    
          // Format thời gian hiện tại: dd/MM/yyyy HH:mm:ss
          const now = new Date();
          const pad = (num: number) => num.toString().padStart(2, "0");
    
          const formattedTime = `${pad(now.getDate())}/${pad(
            now.getMonth() + 1
          )}/${now.getFullYear()} ${pad(now.getHours())}:${pad(
            now.getMinutes()
          )}:${pad(now.getSeconds())}`;
    
          // Gán vào store
          store.setState((prev: any) => ({
            ...prev,
            appSetting: {
              ...prev.appSetting,
              timeSynchronization: formattedTime,
            },
          }));
    
          // Gọi lưu dữ liệu

    
          // Thông báo hoàn tất
          Alert.alert("Thành công", "Đồng bộ hoàn tất!");
        }
      }, 50);
      onSavePress();
      return;
    }
    
    

    if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  React.useEffect(() => {
    onInit(navigation);
    return () => onDeInit();
  }, []);

  return (
    <View style={styles.container}>
      {/* Nút BLE */}
      <View style={styles.bleIconContainer}>
        <TouchableOpacity onLongPress={onBleLongPress} onPress={onBlePress} style={styles.bleButton}>
          {store?.state.hhu.connect === 'CONNECTING' ? (
            <CircleSnail color={['red', 'green', 'blue']} size={28} indeterminate thickness={1} />
          ) : (
            <MaterialCommunityIcons
              name={store?.state.hhu.connect === 'CONNECTED' ? 'bluetooth-connect' : 'bluetooth-off'}
              size={28}
              color={store?.state.hhu.connect === 'CONNECTED' ? '#5fe321' : 'black'}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            style={[styles.card, { marginBottom: 16 }]}
            activeOpacity={0.8}
            onPress={() => onPressItem(item)}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Icon name={item.icon} size={34} color="#fff" />
            </View>

            {/* Label */}
            <Text style={styles.menuLabel}>{item.label}</Text>

            {/* Subtitle */}
            {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Overlay tách riêng, phủ toàn màn hình */}
      <SyncOverlay visible={progress > 0 && progress < 100} progress={progress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', paddingTop: 10 },
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
    paddingTop: 60,
  },
  card: {
    width: itemSize,
    height: itemSize + 25,
    backgroundColor: '#fff',
    borderRadius: 16,
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
  menuLabel: { textAlign: 'center', fontSize: normalize(14), color: '#333', fontWeight: '600' },
  menuSubtitle: { textAlign: 'center', fontSize: normalize(11), color: '#888', marginTop: 4 },
});
