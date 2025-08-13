import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { screenDatas } from '../shared';
import { Fonts } from '../theme';
import { GuideBookScreen } from '../screen/guideBook';
import { DrawerParamsList } from './model/model';

const Stack = createStackNavigator<DrawerParamsList>();

export const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Overview"
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontFamily: Fonts },
      }}
    >
      {screenDatas.map(e => {
        if (e.component) {
          return (
            <Stack.Screen
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
    </Stack.Navigator>
  );
};
