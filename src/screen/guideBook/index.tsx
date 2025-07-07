import React from 'react';
import { StyleSheet } from 'react-native';
import Theme from '../../theme';
import { WebView } from 'react-native-webview';
import { GetHookProps, store } from './controller';

export const GuideBookScreen = () => {
  // useEffect(() => {
  //   controller.onInit();
  //   return controller.onDeInit;
  // }, []);
  GetHookProps();
  const url = `http://${store?.state.appSetting.server.IP}:${
    store?.state.appSetting.server.port
  }/HU_01/HDSD_HU_01.pdf?timestamp=${new Date().getTime()}`;
  return <WebView source={{ uri: url }} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.backgroundColor,
  },
  title: {
    fontSize: 24,
    margin: 10,
    alignSelf: 'center',
  },
});
