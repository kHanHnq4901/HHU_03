import React from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  Platform,
  ViewStyle,
  StatusBarStyle,
} from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

type Props = {
  backgroundColor?: string;
  barStyle?: StatusBarStyle;
};

export let MARGIN_TOP = 0;
export let SAFE_AREA_INSET = {} as EdgeInsets;

export function CustomStatusBar({ backgroundColor = 'white', barStyle = 'dark-content' }: Props) {
  const insets = useSafeAreaInsets();
  SAFE_AREA_INSET = insets;

  // Trên Android: Nếu không có notch, đảm bảo có ít nhất 24
  MARGIN_TOP = Platform.OS === 'android' ? Math.max(insets.top, 24) : insets.top;

  return (
    <View style={[styles.statusBar, { height: MARGIN_TOP, backgroundColor }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={barStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    width: '100%',
  } as ViewStyle,
});
