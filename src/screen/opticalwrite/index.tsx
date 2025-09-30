import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { readConfig, writeConfig } from './handleButton';
import { hookProps, useHookProps } from './controller';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LoadingOverlay } from '../../component/loading';

export const OpticalWriteScreen = () => {
  useHookProps();
  return (
    <View style={styles.container}>
      {/* Overlay loading */}
      <LoadingOverlay
        visible={hookProps.state.isReading}
        message={hookProps.state.textLoading}
      />

      {/* Nội dung chính có thể cuộn */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Serial */}
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Icon name="barcode" size={18} color="#2f4f9d" />
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

        {/* Chu kỳ chốt */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.labelRow}
            onPress={() =>
              hookProps.setState((prev) => ({
                ...prev,
                readCycle: !prev.readCycle,
              }))
            }
          >
            <Icon
              name={
                hookProps.state.readCycle
                  ? 'check-circle'
                  : 'checkbox-blank-outline'
              }
              size={20}
              color={hookProps.state.readCycle ? '#2f4f9d' : '#999'}
            />
            <Text style={styles.label}>Chu kỳ chốt dữ liệu</Text>
          </TouchableOpacity>

          {hookProps.state.cycle && hookProps.state.readCycle && (
            <View style={styles.inputLarge}>
              <Picker
                selectedValue={Number(hookProps.state.cycle) / 60}
                onValueChange={(itemValue) =>
                  hookProps.setState((prev) => ({
                    ...prev,
                    cycle: String(itemValue * 60),
                  }))
                }
              >
                {[2, 3, 4, 6, 8, 12, 24].map((v) => (
                  <Picker.Item key={v} label={`${v} giờ`} value={v} />
                ))}
              </Picker>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.labelRow}
            onPress={() =>
              hookProps.setState((prev) => ({
                ...prev,
                readTimeRange: !prev.readTimeRange,
              }))
            }
          >
            <Icon
              name={
                hookProps.state.readTimeRange
                  ? 'check-circle'
                  : 'checkbox-blank-outline'
              }
              size={20}
              color={hookProps.state.readTimeRange ? '#2f4f9d' : '#999'}
            />
            <Text style={styles.label}>Khoảng giờ (Sáng & Chiều)</Text>
          </TouchableOpacity>

          {hookProps.state.readTimeRange &&
            hookProps.state.timeRange1Start &&
            hookProps.state.timeRange1End &&
            hookProps.state.timeRange2Start &&
            hookProps.state.timeRange2End && (
              <>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      hookProps.setState((prev) => ({
                        ...prev,
                        pickerMode: 't1start',
                      }))
                    }
                  >
                    <Text>
                      {hookProps.formatHour(hookProps.state.timeRange1Start)}
                    </Text>
                  </TouchableOpacity>
                  <Icon
                    name="arrow-right"
                    size={18}
                    color="#555"
                    style={{ marginHorizontal: 8 }}
                  />
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      hookProps.setState((prev) => ({
                        ...prev,
                        pickerMode: 't1end',
                      }))
                    }
                  >
                    <Text>
                      {hookProps.formatHour(hookProps.state.timeRange1End)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      hookProps.setState((prev) => ({
                        ...prev,
                        pickerMode: 't2start',
                      }))
                    }
                  >
                    <Text>
                      {hookProps.formatHour(hookProps.state.timeRange2Start)}
                    </Text>
                  </TouchableOpacity>
                  <Icon
                    name="arrow-right"
                    size={18}
                    color="#555"
                    style={{ marginHorizontal: 8 }}
                  />
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      hookProps.setState((prev) => ({
                        ...prev,
                        pickerMode: 't2end',
                      }))
                    }
                  >
                    <Text>
                      {hookProps.formatHour(hookProps.state.timeRange2End)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
        </View>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.labelRow}
            onPress={() =>
              hookProps.setState((prev) => ({
                ...prev,
                readDaysPerMonth: !prev.readDaysPerMonth,
              }))
            }
          >
            <Icon
              name={
                hookProps.state.readDaysPerMonth
                  ? 'check-circle'
                  : 'checkbox-blank-outline'
              }
              size={20}
              color={hookProps.state.readDaysPerMonth ? '#2f4f9d' : '#999'}
            />
            <Text style={styles.label}>Số ngày/tháng (Tối đa 7)</Text>
          </TouchableOpacity>
          {hookProps.state.readDaysPerMonth &&
            hookProps.state.daysPerMonth.length > 0 && (
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
                    hookProps.setState((prev) => ({
                      ...prev,
                      daysPerMonth: newValue,
                    }));
                  }
                }}
                setItems={(items) =>
                  hookProps.setState((prev) => ({ ...prev, dayItems: items }))
                }
                multiple
                mode="BADGE"
                listMode="MODAL"   // 👈 thay SCROLLVIEW bằng MODAL
                max={7}
                placeholder="Chọn ngày..."
                badgeDotColors={['#007AFF']}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdown}
              />

            )}
        </View>
      </ScrollView>

      {/* Buttons cố định dưới cùng */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1877F2' }]}
          onPress={readConfig}
        >
          <Icon name="download" size={18} color="#fff" />
          <Text style={styles.buttonText}>Đọc cấu hình</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#28A745' }]}
          onPress={writeConfig}
        >
          <Icon name="upload" size={18} color="#fff" />
          <Text style={styles.buttonText}>Gửi cấu hình</Text>
        </TouchableOpacity>
      </View>

      {/* Time picker */}
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
  container: { flex: 1, backgroundColor: '#eef2f9' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 6, color: '#2f4f9d' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  inputLarge: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c3cde6',
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3cde6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dropdown: { borderWidth: 1, borderColor: '#c3cde6' },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#eef2f9',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
});
