// StackRootNavigator.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { scale, Fonts } from '../theme';

import { StackRootParamsList, DrawerParamsList } from './model/model';
import { LoginScreen } from '../screen/login';
import { SettingIPPortScreen } from '../screen/settingIPportScreen';
import { SetUpBleScreen } from '../screen/ble/index';
import { StackNavigator } from './StackNavigator';

export const navigationRef = createNavigationContainerRef<StackRootParamsList>();

const RootStack = createNativeStackNavigator<StackRootParamsList>();
const DrawerStack = createNativeStackNavigator<DrawerParamsList>();

export function StackRootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <RootStack.Screen name="Login" component={LoginScreen} />

        {/* Drawer stack */}
        <RootStack.Screen name="Drawer" component={StackNavigator} />

        <RootStack.Screen
          name="BleScreen"
          component={SetUpBleScreen}
          options={{
            headerShown: true,
            title: 'Bluetooth',
            headerBackVisible: false,
            headerTitleStyle: { fontFamily: Fonts },
            headerLeft: (props) => (
              <View style={{ marginLeft: 8 }}>
                <Pressable onPress={() => navigationRef.goBack()}>
                  <Ionicons
                    size={25 * scale}
                    color={props.tintColor || 'black'}
                    name="chevron-back"
                  />
                </Pressable>
              </View>
            ),
            headerStyle: {
              height: 56,
            },
          }}
        />

        <RootStack.Screen
          name="SettingIPPort"
          component={SettingIPPortScreen}
          options={{
            headerShown: true,
            title: 'Cài đặt địa chỉ IP',
            headerTitleStyle: { fontFamily: Fonts },
            headerStyle: { height: 56 },
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
