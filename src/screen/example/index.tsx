import React, { Component, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Theme from '../../theme';
import * as controller from './controller';

export const ExampleScreen = () => {
  useEffect(() => {
    controller.onInit();
    return controller.onDeInit;
  }, []);
  return (
    <View style={styles.container}>
      <Text>Example</Text>
    </View>
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
});
