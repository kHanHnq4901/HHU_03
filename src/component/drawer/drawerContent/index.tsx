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

  const insetSafeArea = useSafeAreaInsets();

  return (
    <>       
      <DrawerContentScrollView {...props} bounces={false}  >
        <View style={styles.containerInfo}>
          <View style={styles.infoUser}>
            <Image
              source={require('../../../asset/images/image/emic.png')}
              style={
                 styles.logoIOS
              }
              resizeMode="contain"
            />
            {/* <Text style={Theme.StyleCommon.title}>Gelex HHU</Text> */}
          </View>
         

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
                      navigation.navigate('Drawer', {
                        screen: element.id,
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
    color: Colors.primary,
    paddingRight: 5,
  },
  containerInfo: {
    // flex: 1,
    marginBottom: 5,
    // backgroundColor:'red',
  },
  role: {
    fontSize: normalize(15),
    color: Colors.primary,
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
