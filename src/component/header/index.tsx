import { DrawerHeaderProps } from '@react-navigation/drawer';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { CircleSnail } from 'react-native-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { RouteProp, useRoute } from '@react-navigation/native';
import {
  DrawerParamsList,
  ParamsDrawerProps,
} from '../../navigation/model/model';
import { screenDatas } from '../../shared';
import { storeContext } from '../../store';
import Theme, { Colors, normalize, scale } from '../../theme';
import { GetHookProps, navigation } from './controller';
import { onBleLongPress, onBlePress } from './handleButton';
import { MARGIN_TOP } from '../customStatusBar';
import { navigationRef } from '../../navigation/StackRootNavigator';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
const TAG = 'HEADER:';

export const headerData = {
  reserverTitle: '',
};

export let infoHeader = {
  title: screenDatas[0].title,
  info: screenDatas[0].info,
} as ParamsDrawerProps;

const sizeIcon = scale * 25;

export function Header(props?: DrawerHeaderProps) {
  GetHookProps();
  const store = React.useContext(storeContext);
  const route = useRoute<RouteProp<DrawerParamsList, 'Overview'>>();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamsList>>();
  const currentRouteName = navigationRef?.isReady()
    ? navigationRef.getCurrentRoute()?.name

    
    : 'Home';

  // Các màn hình được xem là "Home"
  const homeScreens = [
    'Map',
    'Bottom',
    'Home',
    'Drawer',
    'LogData',
    'HomeLog',
    'Overview',
    'ImportXml',
    'ExportXml',
    'SelectBook',
    'SelectColumn',
    'WriteDataByBookCode',
    'WriteDataByColumnCode',
    'ReadParameter',
    'SettingAndAlarm',
    'BoardBLE',
    'About',
    'ViewRegister',
    'BleScreen',
    'ViewData',
  ];

  const isHome = homeScreens.includes(currentRouteName ?? '');

  // Lấy tiêu đề
  let title = navigationRef?.getCurrentOptions()?.title ?? '';
  if (title === '' || title === 'Bluetooth') {
    title = headerData.reserverTitle;
  } else {
    headerData.reserverTitle = '';
  }

  // Nếu vẫn chưa có title, lấy từ route param
  if (!title && route?.params?.title) {
    title = route.params.title;
  }

  return (
    <>
      <Appbar.Header style={{ backgroundColor: 'white', elevation: 5 }}>
        {!isHome ? (
          <Appbar.BackAction
            onPress={() => navigationRef.goBack()}
            color={Colors.secondary}
          />
        ) : (
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Avatar.Image
              size={40 * scale}
              source={
                (store.state.appSetting.loginMode === 'NPC' ||
                  store.state.appSetting.loginMode === 'ĐL Hà Nội')
                  ? require('../../asset/images/icon/user.png')
                  : require('../../asset/images/icon/rf.jpg')
              }
              style={{ elevation: 5, marginLeft: 5, zIndex: 100 }}
            />
          </TouchableOpacity>
        )}

        <Text style={styles.title}>{title}</Text>
        <View style={{ flex: 1 }} />

        {/* Nút BLE */}
        <TouchableOpacity
          onLongPress={() => {
            headerData.reserverTitle = title;
            onBleLongPress()
          }}
          onPress={onBlePress}
          style={styles.borderIcon}>
          {store?.state.hhu.connect === 'CONNECTING' ? (
            <CircleSnail
              color={['red', 'green', 'blue']}
              size={sizeIcon}
              indeterminate={true}
              thickness={1}
            />
          ) : (
            <MaterialCommunityIcons
              name={
                store?.state.hhu.connect
                  ? 'bluetooth-connect'
                  : 'bluetooth-off'
              }
              size={sizeIcon}
              color={
                store?.state.hhu.connect === 'CONNECTED'
                  ? '#5fe321'
                  : 'black'
              }
            />
          )}
        </TouchableOpacity>
      </Appbar.Header>
    </>
  );
}

const styles = StyleSheet.create({
  itemMenu: {
    height: 30,
    marginHorizontal: 5,
    //marginVertical: 10,
    paddingLeft: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: normalize(18),
    marginLeft: 10,
    letterSpacing: 0.1,
    color: 'black',
    //color: '#1c1cfb',
    //color: Theme.Colors.secondary,
  },
  borderIcon: {
    width: 50 * scale,
    height: 50 * scale,
    borderRadius: 50,
    backgroundColor: Theme.Colors.backgroundIcon,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
