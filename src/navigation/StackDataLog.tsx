import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ExportLogScreen } from '../screen/exportLog';
import { ViewFileDetailScreen } from '../screen/viewFileDetail';
import { StackExportLogList } from './model/model';

const Stack = createNativeStackNavigator<StackExportLogList>();
export function StackDataLogNavigator() {
  return (
    <Stack.Navigator
      initialRouteName='HomeLog'
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name='HomeLog' component={ExportLogScreen} />
      <Stack.Screen name='ViewLogDetail' component={ViewFileDetailScreen} />
    </Stack.Navigator>
  );
}
