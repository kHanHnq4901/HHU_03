import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackRootParamsList } from './model/model';
import { LoginScreen } from '../screen/login';
import { Pressable, Text, View } from 'react-native';
import { DrawerNavigator } from './DrawerNavigator';
import { SettingIPPortScreen } from '../screen/settingIPportScreen';
import { SetUpBleScreen } from '../screen/ble/index';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { scale } from '../theme';

export const navigationRef = createNavigationContainerRef<StackRootParamsList>();

const Stack = createNativeStackNavigator<StackRootParamsList>();
export function StackRootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} >
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        
        <Stack.Screen
          name="BleScreen"
          component={SetUpBleScreen}
          options={{ headerShown: true, title: 'Bluetooth', headerBackVisible: false, 
          headerLeft: (props) => <Pressable onPress={navigationRef.goBack} ><Ionicons size={25 * scale} color={props.tintColor} name='chevron-back'></Ionicons></Pressable> }}
        />
        <Stack.Screen
          name="SettingIPPort"
          component={SettingIPPortScreen}
          options={{
            headerShown: true,
            title: 'Cấu hình địa chỉ IP',
            // headerStyle:{backgroundColor: 'purple'}
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
