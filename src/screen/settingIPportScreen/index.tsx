import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { UpdateHook, hook } from './controller';
import { onSavePress } from './handle';

export const SettingIPPortScreen = () => {
  UpdateHook();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Host</Text>
      <TextInput
        value={hook.state.appSetting.server.host}
        onChangeText={(text) => {
          hook.setState((state) => {
            state.appSetting.server.host = text;
            return { ...state };
          });
        }}
        style={styles.input}
        placeholder="Nhập host"
      />

      <Text style={styles.label}>Port</Text>
      <TextInput
        value={hook.state.appSetting.server.port}
        onChangeText={(text) => {
          hook.setState((state) => {
            state.appSetting.server.port = text;
            return { ...state };
          });
        }}
        style={styles.input}
        placeholder="Nhập port"
        keyboardType="numeric"
      />

      <TouchableOpacity onPress={onSavePress} style={styles.button}>
        <Text style={styles.buttonText}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 10,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007BFF',
    marginTop: 24,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
