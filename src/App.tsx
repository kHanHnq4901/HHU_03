import React from 'react';
import {
  KeyboardAvoidingView,
  LogBox,
  Platform,
  StatusBar,
} from 'react-native';
import 'react-native-gesture-handler';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomStatusBar } from './component/customStatusBar';
import { RootNavigator } from './navigation/RootNavigator';
import { StoreProvider } from './store';
import { Colors } from './theme';

import { decode, encode } from 'base-64';

// Base64 polyfill (for older Android)
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

LogBox.ignoreLogs([
  'Animated: `useNativeDriver`',
  'ViewPropTypes will be removed',
  'new NativeEventEmitter()',
  'Failed prop type: Invalid prop',
  'Require cycle: node_modules',
  'Non-serializable values were found',
  'Warning: Overriding previous layout animation',
]);

export default function App() {
  return (
    <StoreProvider>
      <SafeAreaProvider>
        <PaperProvider
          theme={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: Colors.primary,
            },
            dark: false,
          }}
        >
          <CustomStatusBar backgroundColor={Colors.primary} barStyle="light-content" />
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: 'white' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <RootNavigator />
          </KeyboardAvoidingView>
        </PaperProvider>
      </SafeAreaProvider>
    </StoreProvider>
  );
}
