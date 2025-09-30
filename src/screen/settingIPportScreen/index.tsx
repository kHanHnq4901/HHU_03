import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { UpdateHook, hook } from './controller';
import { onSavePress } from './handle';

export const SettingIPPortScreen = () => {
  UpdateHook();
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Server Section */}
        <Text style={styles.sectionTitle}>⚙️ IP Server</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Host</Text>
          <View style={styles.inputRow}>
            <Text style={styles.icon}>🌐</Text>
            <TextInput
              value={hook.state.appSetting.server.host}
              onChangeText={(text) => {
                hook.setState((state) => {
                  state.appSetting.server.host = text;
                  return { ...state };
                });
              }}
              style={styles.input}
              placeholder="Nhập host (VD: 192.168.1.1)"
              placeholderTextColor="#aaa"
            />
          </View>

          <Text style={styles.label}>Port</Text>
          <View style={styles.inputRow}>
            <Text style={styles.icon}>🔌</Text>
            <TextInput
              value={hook.state.appSetting.server.port}
              onChangeText={(text) => {
                hook.setState((state) => {
                  state.appSetting.server.port = text;
                  return { ...state };
                });
              }}
              style={styles.input}
              placeholder="Nhập port (VD: 8080)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* HHU Section */}
        <Text style={styles.sectionTitle}>📡 IP HHU</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Host</Text>
          <View style={styles.inputRow}>
            <Text style={styles.icon}>🌐</Text>
            <TextInput
              value={hook.state.appSetting.hhu.host}
              onChangeText={(text) => {
                hook.setState((state) => {
                  state.appSetting.hhu.host = text;
                  return { ...state };
                });
              }}
              style={styles.input}
              placeholder="Nhập host (VD: 10.0.2.2)"
              placeholderTextColor="#aaa"
            />
          </View>

          <Text style={styles.label}>Port</Text>
          <View style={styles.inputRow}>
            <Text style={styles.icon}>🔌</Text>
            <TextInput
              value={hook.state.appSetting.hhu.port}
              onChangeText={(text) => {
                hook.setState((state) => {
                  state.appSetting.hhu.port = text;
                  return { ...state };
                });
              }}
              style={styles.input}
              placeholder="Nhập port (VD: 1234)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      {/* Nút lưu */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onSavePress} style={styles.button}>
          <Text style={styles.buttonText}>💾 Lưu cấu hình</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafc',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#333',
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007BFF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
