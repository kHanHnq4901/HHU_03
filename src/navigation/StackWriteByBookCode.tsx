import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SelectBookCodeScreen } from '../screen/selectBookCode';
import { WriteBookCodeScreen } from '../screen/writeDataByBookCode';
import { StackWriteDataByBookCodeList } from './model/model';
import { WriteDataByHandScreen } from '../screen/writeDataByHand';

const Stack = createNativeStackNavigator<StackWriteDataByBookCodeList>();
export function StackWriteBookCodeNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SelectBook"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelectBook" component={SelectBookCodeScreen} />
      <Stack.Screen name="WriteBook" component={WriteBookCodeScreen} />
      <Stack.Screen name="WriteByHand" component={WriteDataByHandScreen} />
    </Stack.Navigator>
  );
}
