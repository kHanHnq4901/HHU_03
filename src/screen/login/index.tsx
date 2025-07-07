import React from 'react';
import {
  BackHandler,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { version as ver } from '../../shared';

import Clipboard from '@react-native-clipboard/clipboard';
// import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FormButton } from '../../component/formButton';
import { FormInput } from '../../component/formInput/index';
import { RadioButton } from '../../component/radioButton/radioButton';
import { Colors, normalize, scale } from '../../theme';
import { showToast } from '../../util';
import { GetHookProps, hookProps, onInit, store } from './controller';
import { onBtnSettingPress, onFingerPress, onGetImageDevicePress, onLoginPress } from './handleButton';

const TAG = 'LoginScreen:';

const version = ver;

let pass = '';

export const LoginScreen = () => {

  GetHookProps();

  const safeAreaInset = useSafeAreaInsets();

  React.useLayoutEffect(() => {
    onInit();
  }, []);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container} >
      <ScrollView >
        {/* <Text style={{ backgroundColor: 'pink' }}>My nae is Tan</Text> */}
        <TouchableOpacity
          style={styles.areaSetting}
          onPress={onBtnSettingPress}>
          <Ionicons name="settings" size={25 * scale} color="#76777a" />
        </TouchableOpacity>
        <View style={styles.containLogo}>
          {/* <Image
          source={require('../../asset/images/logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        /> */}
          <Image
            source={require('../../asset/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
  
          />

          {/* <Text>{hookProps.state.status}</Text> */}
          <Text style={styles.text}>HU-03</Text>
        </View>
        {/* <Text style={styles.textLabelLogin}>Chế độ đăng nhập:</Text> */}
        <View>
              <FormInput
                onChangeText={text => {
                  hookProps.setState(state => {
                    state.user = text;
                    return { ...state };
                  });
                }}
                ref={ref => (this.refAccount = ref)}
                value={hookProps.state.user}
                iconType="user"
                
                autoCorrect={false}
                placeholder="Tên đăng nhập"
                onSubmitEditing={() => {
                  // console.log(
                  //   'hookProps.refPassword?.current?:',
                  //   hookProps.refPassword?.current,
                  // );

                  hookProps.refPassword?.current?.focus();
                }}
                blurOnSubmit={false}
              />
          

          {
            true && (
          <FormInput
            onChangeText={password =>
              hookProps.setState(state => {
                state.password = password;
                return { ...state };
              })
            }
            autoCapitalize='none'
            ref={hookProps.refPassword}
            value={hookProps.state.password}
            placeholder="Mật khẩu"
            iconType="lock"
            secureTextEntry={!hookProps.state.showPassword}
            onLeftIconPress={()=>{
              hookProps.setState(state => {
                state.showPassword =!state.showPassword;
                return {...state}
              });
            }}
            rightChildren={
              (store.state.appSetting.loginMode === 'NPC' /*|| store.state.appSetting.loginMode === 'ĐL Hà Nội'*/) &&
              store.state.typeTouchID !== 'NoSupport' &&
              store.state.typeTouchID === 'TouchID' && (
                <TouchableOpacity onPress={() => onFingerPress(true)}>
                  <Ionicons
                    name="finger-print"
                    color={Colors.secondary}
                    size={25}
                  />
                </TouchableOpacity>
              )
            }
            // blurOnSubmit={false}
            // onSubmitEditing={async()=> {

            //   await onLoginPress();
              
            // }}
          />
            )
          }
        </View>

        <FormButton
          buttonTitle="Đăng nhập"
          isBusy={hookProps.state.btnSignInBusy}
          onPress={() => onLoginPress()}
        />
        <View style={{ flex: 1, height: 50 }} />
      </ScrollView>
      {/* <View style={{...styles.footer, paddingBottom: SAFE_AREA_INSET.bottom}}> */}
      <View style={{...styles.footer, paddingBottom: safeAreaInset.bottom}}>
        <Text style={styles.version}>Phiên bản: {version}</Text>
        {
          (store.state.appSetting.loginMode === 'NPC' || store.state.appSetting.loginMode === 'ĐL Hà Nội' ) &&
          <Text style={styles.version}>{store.state.appSetting.server.host + ( store.state.appSetting.server.port.length > 0 ? ':' + store.state.appSetting.server.port : '')}</Text>
        }
        
        {/* <TouchableOpacity onPress={onBtnSettingPress}>
          <Text style={styles.version}>
            Ngôn ngữ:
            <Text style={styles.language}>
              {store.state.appSetting.currentLanguage}
            </Text>
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>

  );
  
};

const styles = StyleSheet.create({
  textLabelLogin: {
    color: Colors.caption,
    fontSize: normalize(14),
  },
  loginMode: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  footer: {
    backgroundColor: Colors.backgroundColor,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: 3,
    paddingHorizontal: 5,
    // marginBottom: SAFE_AREA_INSET.bottom,
  },
  version: {
    fontSize: normalize(16),
    fontFamily: 'Lato-Regular',
    color: Colors.caption,
  },
  containLineDot: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  separatorLine: {
    height: 2,
    width: 100,
    backgroundColor: Colors.caption,
    paddingHorizontal: 12,
  },
  separatorLineDot: {
    height: 6,
    width: 6,
    borderRadius: 99,
    backgroundColor: Colors.caption,
    marginHorizontal: 12,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: 10 ,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  logo: {
    height: 200 * scale,
    width: 250 * scale,
  },
  text: {
    fontFamily:
      Platform.OS === 'android'
        ? 'SourceCodePro-SemiBoldItalic'
        : 'SourceCodePro-SemiBoldItalic',
    fontSize: normalize(45),
    marginBottom: 10,
    color: '#f3688f',
  },
  containLogo: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  areaSetting: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 10,
    padding: 10,
    zIndex: 1000,
  },
});
