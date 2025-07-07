import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import component from '../component';
import { Header } from '../component/header';
import { GuideBookScreen } from '../screen/guideBook';
import { screenDatas } from '../shared';
import { Fonts, scale } from '../theme';
import { DrawerParamsList } from './model/model';
import { SetUpBleScreen } from '../screen/ble';

const Drawer = createDrawerNavigator<DrawerParamsList>();

export const heightHeader = 50 * scale;

export const DrawerNavigator = () => {
  return (

    <Drawer.Navigator
        initialRouteName="Overview"
        screenOptions={{
          headerTitleStyle: { fontFamily: Fonts },
          drawerStyle: { width: '80%', maxWidth: 450 },
          header: props => <Header {...props}>{null}</Header>, // fix lỗi thiếu children
          swipeEdgeWidth: 0,
        }}
        drawerContent={props => <component.DrawerContent {...props}>{null}</component.DrawerContent>} // fix lỗi thiếu children
      >
        
      {screenDatas.map(e => {
        if (e.component) {
          return (
            <Drawer.Screen
              key={e.id}
              name={e.id}
              component={e.component}
              options={{ title: e.title, headerShown: e.showHeader }}
              initialParams={{ title: e.title, info: e.info }}
            />
          );
        } else {
          return null;
        }
      })}
      
      <Drawer.Screen
        name="GuideBook"
        component={GuideBookScreen}
        options={{ headerShown: false }}
      />
    </Drawer.Navigator>

  );
};
