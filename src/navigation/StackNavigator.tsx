import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { screenDatas } from '../shared';
import { Fonts } from '../theme';
import { DrawerParamsList } from './model/model';

const DrawerStack = createNativeStackNavigator<DrawerParamsList>();

export const StackNavigator = () => {
  return (
    <DrawerStack.Navigator
      initialRouteName="Overview"
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontFamily: Fonts },
        headerStyle: { height: 56 },
      }}
    >
      {screenDatas.map((e) => {
        if (e.component) {
          return (
            <DrawerStack.Screen
              key={e.id}
              name={e.id}
              component={e.component}
              options={{ title: e.title, headerShown: e.showHeader }}
              initialParams={{ title: e.title, info: e.info }}
            />
          );
        }
        return null;
      })}
    </DrawerStack.Navigator>
  );
};