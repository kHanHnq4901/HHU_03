import React, { Component, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Theme, { Colors, normalize } from '../../theme';
import * as controller from './controller';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackExportLogList } from '../../navigation/model/model';

export const ViewFileDetailScreen = () => {

  const route = useRoute<RouteProp<StackExportLogList, 'ViewLogDetail'>>();

  const fileInfo = route.params;

  controller.GetHookProps();

  useEffect(() => {
    controller.onInit(fileInfo);
    return controller.onDeInit;
  }, [fileInfo]);

  return (
    <ScrollView style={{paddingHorizontal: 3, paddingVertical: 10}}  refreshControl={
      <RefreshControl refreshing={controller.hookProps.state.isBusy} ></RefreshControl>
    } >
      <Text style={styles.content}  >{controller.hookProps.state.contentFile}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.backgroundColor,
  },
  title: {
    fontSize: 24,
    margin: 10,
    alignSelf: 'center',
  },
  content: {
    color: Colors.text,
    fontSize: normalize(16),
  }
});
