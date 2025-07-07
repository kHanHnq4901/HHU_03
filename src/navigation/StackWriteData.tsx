import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WriteDataByHandScreen } from '../screen/writeDataByHand';
import { WriteRegisterScreen } from '../screen/WriteRegister';
import { StackWriteDataList } from './model/model';

const Stack = createNativeStackNavigator<StackWriteDataList>();
export function StackWriteDataNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="WriteRegister"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WriteRegister" component={WriteRegisterScreen} />
      <Stack.Screen
        name="WriteRegisterByHand"
        component={WriteDataByHandScreen}
      />
    </Stack.Navigator>
  );
}
