import React from 'react';
import {
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { version as ver } from '../../shared';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FormButton } from '../../component/formButton';
import { FormInput } from '../../component/formInput/index';
import { Colors, normalize, scale } from '../../theme';
import LinearGradient from 'react-native-linear-gradient';
import { GetHookProps, hookProps, onInit, store } from './controller';
import { onBtnSettingPress, onFingerPress, onLoginPress } from './handleButton';

const version = ver;

export const LoginScreen = () => {
  GetHookProps();
  const safeAreaInset = useSafeAreaInsets();

  React.useLayoutEffect(() => {
    onInit();
  }, []);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );
    return () => backHandler.remove();
  }, []);

  return (
    <ImageBackground
        source={require('../../asset/images/image/background-3.jpg')} // hoặc .png
        style={{ flex: 1 }}
        resizeMode="cover"
      >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollView,
              { paddingTop: safeAreaInset.top + 10 }, // đảm bảo không bị che bởi status bar
            ]}
          >
          <TouchableOpacity style={styles.areaSetting} onPress={onBtnSettingPress}>
            <Ionicons name="settings" size={26 * scale} color="#4f4f4f" />
          </TouchableOpacity>

          <View style={styles.containLogo}>
            <Image
              source={require('../../asset/images/image/emic.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>HU-03</Text>
          </View>

          <View style={styles.formContainer}> 
            <FormInput
              onChangeText={text =>
                hookProps.setState(state => {
                  state.user = text;
                  return { ...state };
                })
              }
              value={hookProps.state.user}
              iconType="user"
              autoCorrect={false}
              placeholder="Tên đăng nhập"
              onSubmitEditing={() => {
                hookProps.refPassword?.current?.focus();
              }}
              blurOnSubmit={false}
            />

            <FormInput
              onChangeText={password =>
                hookProps.setState(state => {
                  state.password = password;
                  return { ...state };
                })
              }
              autoCapitalize="none"
              ref={hookProps.refPassword}
              value={hookProps.state.password}
              placeholder="Mật khẩu"
              iconType="lock"
              secureTextEntry={!hookProps.state.showPassword}
              onLeftIconPress={() => {
                hookProps.setState(state => {
                  state.showPassword = !state.showPassword;
                  return { ...state };
                });
              }}
              rightChildren={
                store.state.typeTouchID === 'TouchID' && (
                  <TouchableOpacity onPress={() => onFingerPress(true)}>
                    <Ionicons name="finger-print" color={Colors.secondary} size={24} />
                  </TouchableOpacity>
                )
              }
            />

            <FormButton
              buttonTitle="Đăng nhập"
              isBusy={hookProps.state.btnSignInBusy}
              onPress={() => onLoginPress()}
            />
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: safeAreaInset.bottom }]}>
          <Text style={styles.version}>Phiên bản: {version}</Text>
            <Text style={styles.version}>
              {store.state.appSetting.server.host +
                (store.state.appSetting.server.port.length > 0
                  ? ':' + store.state.appSetting.server.port
                  : '')}
            </Text>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  scrollView: {
    paddingHorizontal: 0,
    paddingTop: 0,
    alignItems: 'center',
  },
  containLogo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    height: 180 * scale,
    width: 220 * scale,
    marginBottom: 10,
  },
  title: {
    fontSize: normalize(36),
    fontWeight: '700',
    color: '#2c3e50',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#ffffffcc',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  areaSetting: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 999,
    padding: 10,
  },
  footer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  version: {
    fontSize: normalize(13),
    color: '#7f8c8d',
    fontFamily: 'Lato-Regular',
  },
});
