import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  backgroundColor?: string;
  barStyle?: 'dark-content' | 'light-content';
};

export let MARGIN_TOP = 0;

export let SAFE_AREA_INSET = {} as EdgeInsets;

export function CustomStatusBar(props: Props) {
  const safeAreaInsets = useSafeAreaInsets();
  MARGIN_TOP = safeAreaInsets.top < 24 ? 24 : safeAreaInsets.top;
  SAFE_AREA_INSET = safeAreaInsets;
  return (
    <View
      style={{
        ...styles.container,
        height: MARGIN_TOP,
        backgroundColor: props.backgroundColor ?? 'white',
        //backgroundColor: 'white',
      }}>
      <StatusBar
        translucent
        barStyle={props.barStyle ?? 'dark-content'}
        backgroundColor={props.backgroundColor ?? 'white'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // height: STATUS_BAR_HEIGHT,
    // backgroundColor: 'white',
  },
});
