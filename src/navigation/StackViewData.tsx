import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ViewDetailRegisterScreen } from '../screen/ViewDetailRegister/index';
import { ViewRegisterScreen } from '../screen/ViewRegister';
import { StackViewDataList } from './model/model';

const Stack = createNativeStackNavigator<StackViewDataList>();
export function StackViewDataNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ViewRegister"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ViewRegister" component={ViewRegisterScreen} />
      <Stack.Screen
        name="ViewRegisterDetailed"
        component={ViewDetailRegisterScreen}
      />
    </Stack.Navigator>
  );
}
