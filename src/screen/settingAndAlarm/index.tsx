import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  InputAccessoryView,
  Keyboard,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { Button } from '../../component/button/button';
import { Text } from '../../component/Text';
import { Colors, CommonHeight, normalize, CommonFontSize } from '../../theme';
import { GetHookProps, onInit, store } from './controller';
import { onSavePress } from './handleButton';

const inputAccessoryViewID = 'uniqueID';

export const SystemSettingScreen = () => {
  GetHookProps();
  React.useLayoutEffect(() => {
    onInit();
  }, []);
  return (
    <>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <Button onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Khoảng cách đọc tự động (m³):</Text>
            <TextInput
              keyboardType="numeric"
              value={store.state.appSetting.setting.distance}
              style={styles.textInput}
              onChangeText={text => {
                store.setState(prev => ({
                  ...prev,
                  appSetting: {
                    ...prev.appSetting,
                    setting: {
                      ...prev.appSetting.setting,
                      distance: text, // cập nhật field distance
                    },
                  },
                }));
              }}
            />
          </View>
        </View>

        {/* Ngưỡng cảnh báo */}
        <View style={styles.group}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngưỡng thấp (m³):</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Nhập giá trị"
              value={store.state.appSetting.setting.lowerThresholdValue}
              style={styles.textInput}
              onChangeText={text => {
                store.setState(prev => ({
                  ...prev,
                  appSetting: {
                    ...prev.appSetting,
                    setting: {
                      ...prev.appSetting.setting,
                      lowerThresholdValue: text,
                    },
                  },
                }));
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngưỡng cao (m³):</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Nhập giá trị"
              value={store.state.appSetting.setting.upperThresholdValue}
              style={styles.textInput}
              onChangeText={text => {
                store.setState(prev => ({
                  ...prev,
                  appSetting: {
                    ...prev.appSetting,
                    setting: {
                      ...prev.appSetting.setting,
                      upperThresholdValue: text,
                    },
                  },
                }));
              }}
            />
          </View>
        </View>
      </ScrollView>
      <View style={styles.btnBottom}>
        <Button style={styles.button} label="Lưu cài đặt" onPress={onSavePress} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 15,
    paddingTop: 20,
  },
  title: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  group: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  groupTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: normalize(15),
    marginBottom: 5,
    color: Colors.text,
  },
  textInput: {
    width: '100%',
    height: CommonHeight,
    fontSize: CommonFontSize,
    borderColor: '#6e83e4',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    color: Colors.text,
    backgroundColor: '#fff',
  },
  btnBottom: {
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '60%',
    height: 50,
    maxWidth: 350,
  },
});
