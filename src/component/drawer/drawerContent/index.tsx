import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View
} from 'react-native';
import { Avatar, Divider } from 'react-native-paper';
import {
  DrawerNavigationProps,
  DrawerParamsList,
  StackRootNavigationProp,
} from '../../../navigation/model/model';
import { BackHandler } from 'react-native';
import { endPoints, getNsxUrl } from '../../../service/api';
import { screenDatas, version } from '../../../shared';
import Theme, { Colors, normalize } from '../../../theme';
import { Text } from '../../Text';
import { infoHeader } from '../../header';
import { DrawerItem } from '../drawerItem';
import { GetHookProps, onDeInit, onInit, store } from './controller';
import { SAFE_AREA_INSET } from '../../customStatusBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationRef } from '../../../navigation/StackRootNavigator';

const TAG = 'DrawerContent:';

export const DrawerContent = (props: React.JSX.IntrinsicAttributes & ScrollViewProps & { children: React.ReactNode; } & React.RefAttributes<ScrollView>) => {
  const navigation = useNavigation<DrawerNavigationProps>();
  const navigationRoot = useNavigation<StackRootNavigationProp>();

  GetHookProps();

  React.useEffect(() => {
    onInit(navigation);

    return () => {
      onDeInit();
    };
  }, []);

  // useEffect(() => {
  //   //console.log('a');
  //   return () => {
  //     console.log('onDeinit:', store?.state.appSetting);
  //     saveValueAppSettingToNvm(store?.state.appSetting as PropsAppSetting);
  //   };
  // }, [store?.state.appSetting]);

  //console.log('ren drawer');

  const role =
    store?.state.userRole === 'admin'
      ? 'Admin'
      : store?.state.userRole === 'dvkh'
      ? 'DVKH'
      : store?.state.userRole === 'sx'
      ? 'Sản xuất'
      : 'Nhân viên';

  const insetSafeArea = useSafeAreaInsets();

  return (
    <>       
      <DrawerContentScrollView {...props} bounces={false}  >
      <Image source={require('../../../asset/images/drawer/HeaderDrawer.jpg')}
            style={{ position:'absolute',  top: 0, left: 0 , width:'100%', height: 120,}}
                        resizeMode='stretch'></Image>
        <View style={styles.containerInfo}>
          <View style={styles.infoUser}>
            <Avatar.Image
                size={60}
                style={{ marginBottom: 10, elevation: 1 , marginTop: 0}}
                source={require('../../../asset/images/icon/rf.jpg')}
              />
            <Image
              source={require('../../../asset/images/logo/logo.png')}
              style={
                 styles.logoIOS
              }
              resizeMode="contain"
            />
            {/* <Text style={Theme.StyleCommon.title}>Gelex HHU</Text> */}
          </View>
          {store.state.appSetting.loginMode === 'KH Lẻ' && (
            <Text style={styles.role}>{role}</Text>
          )}
          {store.state.appSetting.loginMode === 'NPC' && (
            <Text style={styles.role}>
              Xin chào:{'  '}
              <Text style={styles.userOnline}>
                {store.state.NPCUser.moreInfoUser.userName}
                <Text style={styles.role}>
                  : {store.state.NPCUser.user.BUSSINESSID}!
                </Text>
              </Text>
            </Text>
          )}
          {store.state.appSetting.loginMode === 'ĐL Hà Nội' && (
            <Text style={styles.role}>
              Xin chào:{'  '}
              <Text style={styles.userOnline}>
                {/* {store.state.DLHNUser.moreInfoUser.userName} */}
                {store.state.appSetting.isCMISDLHN ? 'CMIS' : 'ĐLHN'}
              </Text>
            </Text>
          )}

          <View style={styles.body}>
            <Divider />
            {screenDatas.map(element => {
              if (element.component) {
                return (
                  <DrawerItem
                    key={element.id}
                    lable={element.title}
                    icon={element.icon}
                    colorIcon={Theme.Colors.primary}
                    onPress={() => {
                      infoHeader.title = element.title;
                      infoHeader.info = element.info;

                      // ✅ Log để debug:
                      console.log('Navigating to:', element.id);
                      console.log('info:', element.info);
                      console.log('title:', element.title);

                      navigation.navigate('Drawer', {
                        screen: element.id as keyof DrawerParamsList,
                        params: {
                          title: element.title,
                          info: element.info,
                        },
                      });
                    }}
                  />
                );
              } else {
                return null;
              }
            })}

            {/* title: 'Đọc RF',
    info: `
    Đọc dữ liệu tức thời công tơ bất kỳ, dữ liệu sẽ không được lưu vào DB.
    Chức năng Khởi tạo, Dò sóng , Reset module công tơ
    `,

    id: 'ReadParameter',
    icon: 'ios-book-outline',
    component: ReadParameterScreen, */}
            {/* <DrawerItem
              lable="Đọc RF"
              icon="ios-book-outline"
              colorIcon={Theme.Colors.primary}
              onPress={() => {
                //console.log(element.id);
                infoHeader.title = 'Đọc RF';
                infoHeader.info = `
                      Đọc dữ liệu tức thời công tơ bất kỳ, dữ liệu sẽ không được lưu vào DB.
                      Chức năng Khởi tạo, Dò sóng , Reset module công tơ
                      `;
                navigation.navigate('ReadParameter', {
                  info: `
                        Đọc dữ liệu tức thời công tơ bất kỳ, dữ liệu sẽ không được lưu vào DB.
                        Chức năng Khởi tạo, Dò sóng , Reset module công tơ
                        `,
                  title: 'Đọc RF',
                });
              }}
            /> */}

            <Divider />
            <DrawerItem
                lable="Hướng dẫn sử dụng"
                icon="help-circle"
                onPress={async () => {
                  const url = getNsxUrl(endPoints.getHDSD);
                  try {
                    await Linking.openURL(url);
                    console.log(url);
                  } catch (err:any) {
                    Alert.alert('Không thể mở trang web này');
                    console.log(TAG, err.message);
                    navigation.navigate('GuideBook');
                  }
                }}
                colorIcon={Theme.Colors.primary}
              />
            <View style={{ height: 30 }} />
            <DrawerItem
              lable="Đăng xuất"
              icon="log-out"
              onPress={() => {
                //navigationRoot.navigate('Login');
                Alert.alert('', 'Bạn có muốn đăng xuất ?', [
                  {
                    text: 'Hủy',
                    onPress: () => {},
                    style: 'cancel',
                  },
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('exit app');
                      navigationRoot.push('Login');
                    },
                  },
                ]);
              }}
              colorIcon={Theme.Colors.primary}
              // style={{ color: Theme.Colors.primary }}
            />

            <DrawerItem
              lable="Thoát"
              icon="log-out-outline"
              onPress={() => {
                //navigationRoot.navigate('Login');
                Alert.alert('Thoát', 'Bạn có muốn thoát ứng dụng ?', [
                  {
                    text: 'Hủy',
                    onPress: () => {},
                    style: 'cancel',
                  },
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('exit app');

                      //BackHandler.exitApp();
                      BackHandler.exitApp();
                    },
                  },
                ]);
              }}
              colorIcon={Theme.Colors.primary}
              // style={{ color: Theme.Colors.primary }}
            />
          </View>
        </View>
      </DrawerContentScrollView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginHorizontal: 20,
          paddingBottom: SAFE_AREA_INSET.bottom,
        }}>
        <Text style={styles.textVersion}>
          HU {store?.state.hhu.shortVersion}
        </Text>
        <Text style={styles.textVersion}>Phiên bản {version}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  userOnline: {
    fontSize: normalize(18),
    color: Colors.secondary,
    paddingRight: 5,
  },
  containerInfo: {
    // flex: 1,
    marginBottom: 5,
    // backgroundColor:'red',
  },
  role: {
    fontSize: normalize(15),
    color: Colors.caption,
    alignSelf: 'flex-end',
    paddingRight: 5,
  },
  textVersion: {
    fontSize: normalize(12),
    color: Colors.caption,
  },
  body: {
    marginHorizontal: 20,
    marginVertical: 10,
    paddingTop: 10,
  },
  infoUser: {
    flexDirection: 'column',
    alignItems: 'center',
    // marginTop: -30,
    // backgroundColor: 'pink',
  },
  version: {
    alignItems: 'flex-end',
    marginRight: 20,
  },
  versionHHU: {
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  logoAndroid: { height: 50, width: 150 },
  logoIOS: { height: 50, width: 150, },
});
