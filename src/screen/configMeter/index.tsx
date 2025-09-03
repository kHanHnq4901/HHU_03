import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CheckBox from '@react-native-community/checkbox';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { readConfig, testConfig, writeConfig } from './handleButton';
import { store } from '../overview/controller';
import { hookProps, useHookProps } from './controller';

export const ConfigMeterScreen = () => {
  useHookProps();
  return (
    <View style={styles.container}>
      {/* Serial */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Serial</Text>
        </View>
        <TextInput
          style={styles.inputLarge}
          value={hookProps.state.serial}
          onChangeText={(text) =>
            hookProps.setState((prev) => ({ ...prev, serial: text }))
          }
          placeholder="Nhập Serial"
          placeholderTextColor="#888"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Chu kỳ */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <CheckBox
            value={hookProps.state.readCycle}
            onValueChange={(val) =>
              hookProps.setState((prev) => ({ ...prev, readCycle: val }))
            }
          />
          <Text style={styles.label}>Chu kỳ chốt dữ liệu</Text>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={hookProps.state.cycle}
            onValueChange={(itemValue) =>
              hookProps.setState((prev) => ({ ...prev, cycle: itemValue }))
            }
          >
            {[2, 3, 4, 6, 8, 12, 24].map((v) => (
              <Picker.Item key={v} label={`${v} tiếng`} value={`${v}`} />
            ))}
          </Picker>
        </View>
      </View>

{/* Khoảng giờ (sáng + chiều) */}
<View style={styles.section}>
  <View style={styles.labelRow}>
    <CheckBox
      value={hookProps.state.readTimeRange} // gộp thành 1 state duy nhất
      onValueChange={(val) =>
        hookProps.setState((prev) => ({ ...prev, readTimeRange: val }))
      }
    />
    <Text style={styles.label}>Khoảng giờ (Sáng & Chiều)</Text>
  </View>

  {/* Sáng */}
  <View style={styles.timeRow}>
    <TouchableOpacity
      style={styles.input}
      onPress={() =>
        hookProps.setState((prev) => ({ ...prev, pickerMode: 't1start' }))
      }
    >
      <Text>{hookProps.formatHour(hookProps.state.timeRange1Start)}</Text>
    </TouchableOpacity>
    <Text style={{ marginHorizontal: 8 }}>→</Text>
    <TouchableOpacity
      style={styles.input}
      onPress={() =>
        hookProps.setState((prev) => ({ ...prev, pickerMode: 't1end' }))
      }
    >
      <Text>{hookProps.formatHour(hookProps.state.timeRange1End)}</Text>
    </TouchableOpacity>
  </View>

  {/* Chiều */}
  <View style={styles.timeRow}>
    <TouchableOpacity
      style={styles.input}
      onPress={() =>
        hookProps.setState((prev) => ({ ...prev, pickerMode: 't2start' }))
      }
    >
      <Text>{hookProps.formatHour(hookProps.state.timeRange2Start)}</Text>
    </TouchableOpacity>
    <Text style={{ marginHorizontal: 8 }}>→</Text>
    <TouchableOpacity
      style={styles.input}
      onPress={() =>
        hookProps.setState((prev) => ({ ...prev, pickerMode: 't2end' }))
      }
    >
      <Text>{hookProps.formatHour(hookProps.state.timeRange2End)}</Text>
    </TouchableOpacity>
  </View>
</View>


      {/* Ngày/tháng */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <CheckBox
            value={hookProps.state.readDaysPerMonth}
            onValueChange={(val) =>
              hookProps.setState((prev) => ({ ...prev, readDaysPerMonth: val }))
            }
          />
          <Text style={styles.label}>Số ngày/tháng (Tối đa 7)</Text>
        </View>
        <DropDownPicker
          open={hookProps.state.openDays}
          value={hookProps.state.daysPerMonth}
          items={hookProps.state.dayItems}
          setOpen={(val) =>
            hookProps.setState((prev) => ({ ...prev, openDays: val }))
          }
          setValue={(callback) => {
            const newValue = callback(hookProps.state.daysPerMonth);
            if (newValue.length <= 7) {
              hookProps.setState((prev) => ({ ...prev, daysPerMonth: newValue }));
            }
          }}
          setItems={(items) =>
            hookProps.setState((prev) => ({ ...prev, dayItems: items }))
          }
          multiple
          mode="BADGE"
          listMode="SCROLLVIEW"
          max={7}
          placeholder="Chọn ngày..."
          badgeDotColors={['#007AFF']}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdown}
        />
      </View>

      {/* Nút hành động */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1877F2' }]}
          onPress={() => readConfig()}
        >
          <Text style={styles.buttonText}>Đọc cấu hình</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#28A745' }]}
          onPress={writeConfig}
        >
          <Text style={styles.buttonText}>Gửi cấu hình</Text>
        </TouchableOpacity>
      </View>

      {hookProps.state.pickerMode && (
        <DateTimePicker
          value={
            hookProps.state.pickerMode === 't1start'
              ? hookProps.state.timeRange1Start
              : hookProps.state.pickerMode === 't1end'
              ? hookProps.state.timeRange1End
              : hookProps.state.pickerMode === 't2start'
              ? hookProps.state.timeRange2Start
              : hookProps.state.timeRange2End
          }
          mode="time"
          is24Hour={true}
          display="spinner"
          minuteInterval={60}
          onChange={(_, date) =>
            hookProps.onChangeTime(hookProps.state.pickerMode!, date || undefined)
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  label: { fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  section: { marginBottom: 12 },
  inputLarge: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#888',
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#000',
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerContainer: { borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dropdown: { borderColor: '#ccc' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
