import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Button } from '../../component/button/button';
import { Text } from '../../component/Text';
import { Colors, CommonHeight, normalize, CommonFontSize } from '../../theme';
import { GetHookProps, onInit, store } from './controller';
import { onSavePress } from './handleButton';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const inputAccessoryViewID = 'uniqueID';

export const SystemSettingScreen = () => {
  GetHookProps();

  React.useLayoutEffect(() => {
    onInit();
  }, []);

  const setting = store.state.appSetting.setting;

  return (
    <LinearGradient colors={['#f9fbfd', '#eef3f7']} style={{ flex: 1 }}>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <Button onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Khoảng cách đọc */}
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Icon name="map-marker-distance" size={18} color={Colors.primary} />
              <Text style={styles.groupTitle}>Cấu hình đọc</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Khoảng cách đọc tự động (m³)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="ruler" size={18} color="#6e83e4" style={styles.inputIcon} />
                <TextInput
                  keyboardType="numeric"
                  value={setting.distance}
                  style={styles.textInput}
                  placeholder="Nhập khoảng cách"
                  onChangeText={(text) => {
                    store.setState((prev) => ({
                      ...prev,
                      appSetting: {
                        ...prev.appSetting,
                        setting: { ...prev.appSetting.setting, distance: text },
                      },
                    }));
                  }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phương tiện di chuyển</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={setting.vehicle}
                  onValueChange={(value) => {
                    store.setState((prev) => ({
                      ...prev,
                      appSetting: {
                        ...prev.appSetting,
                        setting: { ...prev.appSetting.setting, vehicle: value },
                      },
                    }));
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="🚗 Ô tô" value="driving" />
                  <Picker.Item label="🛵 Xe máy" value="motorcycling" />
                  <Picker.Item label="🚶 Đi bộ" value="walking" />
                  <Picker.Item label="🚛 Xe tải" value="truck" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zoom bản đồ</Text>
              <View style={styles.inputWrapper}>
                <Icon name="magnify-plus-outline" size={18} color="#6e83e4" style={styles.inputIcon} />
                <TextInput
                  keyboardType="numeric"
                  value={setting.zoomLevel}
                  style={styles.textInput}
                  placeholder="Nhập mức zoom"
                  onChangeText={(text) => {
                    store.setState((prev) => ({
                      ...prev,
                      appSetting: {
                        ...prev.appSetting,
                        setting: { ...prev.appSetting.setting, zoomLevel: text },
                      },
                    }));
                  }}
                />
              </View>
            </View>
          </View>

          {/* Ngưỡng cảnh báo */}
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Icon name="alert-decagram-outline" size={18} color="#f57c00" />
              <Text style={styles.groupTitle}>Ngưỡng cảnh báo</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngưỡng thấp (m³)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="arrow-collapse-down" size={18} color="#f57c00" style={styles.inputIcon} />
                <TextInput
                  keyboardType="numeric"
                  value={setting.lowerThresholdValue}
                  style={styles.textInput}
                  placeholder="Nhập giá trị thấp"
                  onChangeText={(text) => {
                    store.setState((prev) => ({
                      ...prev,
                      appSetting: {
                        ...prev.appSetting,
                        setting: { ...prev.appSetting.setting, lowerThresholdValue: text },
                      },
                    }));
                  }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngưỡng cao (m³)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="arrow-collapse-up" size={18} color="#d32f2f" style={styles.inputIcon} />
                <TextInput
                  keyboardType="numeric"
                  value={setting.upperThresholdValue}
                  style={styles.textInput}
                  placeholder="Nhập giá trị cao"
                  onChangeText={(text) => {
                    store.setState((prev) => ({
                      ...prev,
                      appSetting: {
                        ...prev.appSetting,
                        setting: { ...prev.appSetting.setting, upperThresholdValue: text },
                      },
                    }));
                  }}
                />
              </View>
            </View>
          </View>

          {/* Preview */}
          <View style={[styles.group, { borderColor: '#6e83e4' }]}>
            <View style={styles.groupHeader}>
              <Icon name="eye-outline" size={18} color="#6e83e4" />
              <Text style={styles.groupTitle}>Xem trước cài đặt</Text>
            </View>
            <Text style={{ color: Colors.text, fontSize: 14 }}>
              📏 Khoảng cách: {setting.distance || '--'} m³
            </Text>
            <Text style={{ color: Colors.text, fontSize: 14 }}>
              🚙 Phương tiện: {setting.vehicle || '--'}
            </Text>
            <Text style={{ color: Colors.text, fontSize: 14 }}>
              🔍 Zoom: {setting.zoomLevel || '--'}
            </Text>
            <Text style={{ color: Colors.text, fontSize: 14 }}>
              ⚠️ Ngưỡng: {setting.lowerThresholdValue || '--'} - {setting.upperThresholdValue || '--'} m³
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Button */}
      <View style={styles.btnBottom}>
        <LinearGradient colors={['#6e83e4', '#4a5bdc']} style={styles.button}>
          <Button
            label="💾 Lưu cài đặt"
            onPress={onSavePress}
            textStyle={{ color: '#fff', fontWeight: '600' }}
          />
        </LinearGradient>
      </View>
    </LinearGradient>
  );
};

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 15,
    paddingTop: 10,
  },
  group: {
    marginBottom: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: normalize(15),
    fontWeight: '700',
    marginLeft: 6,
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: normalize(14),
    marginBottom: 4,
    color: Colors.text,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#6e83e4',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    height: CommonHeight,
    fontSize: CommonFontSize,
    color: Colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#6e83e4',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  picker: {
    height: CommonHeight,
    width: '100%',
    color: Colors.text,
  },
  btnBottom: {
    marginVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
});
