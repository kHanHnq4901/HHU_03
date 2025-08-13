import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export const ConfigMeterScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [serial, setSerial] = useState('');
  const [systemTime, setSystemTime] = useState('');
  const [cycle, setCycle] = useState('1 phút');
  const [timeRange1, setTimeRange1] = useState('');
  const [timeRange2, setTimeRange2] = useState('');
  const [daysPerMonth, setDaysPerMonth] = useState('7');

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>


      {/* Serial */}
      <Text style={[styles.label, { color: theme.text }]}>Serial</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        value={serial}
        onChangeText={setSerial}
        placeholder="Nhập Serial"
        placeholderTextColor={theme.placeholder}
      />

      {/* System Time */}
      <Text style={[styles.label, { color: theme.text }]}>Thời gian hệ thống</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        value={systemTime}
        onChangeText={setSystemTime}
        placeholder="YYYY-MM-DD HH:mm"
        placeholderTextColor={theme.placeholder}
      />

      {/* Cycle Config */}
      <Text style={[styles.label, { color: theme.text }]}>Chu kỳ chốt dữ liệu</Text>
      <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg }]}>
        <Picker
          selectedValue={cycle}
          onValueChange={(itemValue) => setCycle(itemValue)}
          dropdownIconColor={theme.text}
          style={{ color: theme.text }}
        >
          <Picker.Item label="1 phút" value="1 phút" />
          <Picker.Item label="1 giờ" value="1 giờ" />
          <Picker.Item label="24 giờ" value="24 giờ" />
        </Picker>
      </View>

      {/* Time range 1 */}
      <Text style={[styles.label, { color: theme.text }]}>Khoảng giờ 1</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        value={timeRange1}
        onChangeText={setTimeRange1}
        placeholder="HH:mm - HH:mm"
        placeholderTextColor={theme.placeholder}
      />

      {/* Time range 2 */}
      <Text style={[styles.label, { color: theme.text }]}>Khoảng giờ 2</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        value={timeRange2}
        onChangeText={setTimeRange2}
        placeholder="HH:mm - HH:mm"
        placeholderTextColor={theme.placeholder}
      />

      {/* Days per month */}
      <Text style={[styles.label, { color: theme.text }]}>Số ngày/tháng</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        value={daysPerMonth}
        onChangeText={setDaysPerMonth}
        keyboardType="numeric"
        placeholder="Ví dụ: 7"
        placeholderTextColor={theme.placeholder}
      />

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#1877F2' }]}>
          <Text style={styles.buttonText}>Đọc cấu hình</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#28A745' }]}>
          <Text style={styles.buttonText}>Gửi cấu hình</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const lightTheme = {
  bg: '#FFFFFF',
  text: '#000000',
  inputBg: '#F0F2F5',
  placeholder: '#999999',
};

const darkTheme = {
  bg: '#18191A',
  text: '#E4E6EB',
  inputBg: '#3A3B3C',
  placeholder: '#B0B3B8',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 15,
  },
  pickerContainer: {
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
