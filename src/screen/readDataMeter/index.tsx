import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  InputAccessoryView,
  Keyboard,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button } from '../../component/button/button';
import { Text } from '../../component/Text';
import { CommonHeight, normalize, CommonFontSize } from '../../theme';
import { onReadData } from './handleButton';
import { GetHookProps, hookProps } from './controller';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const inputAccessoryViewID = 'uniqueID';

export const RealDataMeterScreen = () => {
  GetHookProps();
  const { state, setState } = hookProps;

  const toggleDetailedRead = () => {
    setState((prev) => ({ ...prev, isDetailedRead: !prev.isDetailedRead }));
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <Button onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Serial + toggle chi tiết */}
        <View style={styles.serialRow}>
          <TextInput
            placeholder="🔢 Nhập serial công tơ"
            value={state.serial}
            style={styles.textInput}
            placeholderTextColor="#888"
            onChangeText={(text) => setState((prev) => ({ ...prev, serial: text }))}
          />
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              state.isDetailedRead && styles.checkboxContainerActive,
            ]}
            onPress={toggleDetailedRead}
            activeOpacity={0.7}
          >
            <Icon
              name={state.isDetailedRead ? 'check-circle' : 'checkbox-blank-outline'}
              size={20}
              color={state.isDetailedRead ? '#fff' : '#2f4f9d'}
            />
            <Text
              style={[
                styles.checkboxLabel,
                state.isDetailedRead && { color: '#fff' },
              ]}
            >
              Chi tiết
            </Text>
          </TouchableOpacity>
        </View>

        {/* Thông tin kết quả đọc */}
        {state.meterData && (
          <>
            <Text style={styles.sectionTitle}>📊 Kết quả đọc</Text>
            <InfoRow label="🔧 Serial" value={state.meterData.serial} />
            <InfoRow label="⏰ Thời gian" value={state.meterData.currentTime} />
            <InfoRow label="🔢 Chỉ số xuôi" value={state.meterData.impData} />
            <InfoRow label="📤 Chỉ số ngược" value={state.meterData.expData} />
            <InfoRow label="🔋 Pin" value={state.meterData.batteryLevel} />
            <InfoRow label="⏱ Chu kỳ chốt" value={state.meterData.latchPeriod} />

            <Text style={styles.sectionTitle}>📝 Sự kiện</Text>
            {Array.isArray(state.meterData.event) && state.meterData.event.length > 0 ? (
              state.meterData.event.map((e: string, i: number) => (
                <Text key={i} style={styles.eventItem}>
                  • {e}
                </Text>
              ))
            ) : (
              <Text style={styles.eventItem}>Không có sự kiện</Text>
            )}
          </>
        )}

        {/* Danh sách bản ghi */}
        {(state.meterData?.dataRecords?.length ?? 0) > 0 && (
          <>
            <Text style={styles.sectionTitle}>📂 90 bản ghi gần nhất</Text>
            <FlatList
              data={state.meterData?.dataRecords ?? []}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.recordItem,
                    index % 2 === 0 && { backgroundColor: '#f7f9fc' },
                  ]}
                >
                  <Text style={styles.recordIndex}>{index + 1}</Text>
                  <Text style={styles.recordDate}>{item.timestamp}</Text>
                  <Text style={styles.recordValue}>{item.value}</Text>
                </View>
              )}
              scrollEnabled={false}
            />
          </>
        )}
      </ScrollView>

      {/* Button đọc dữ liệu */}
      <View style={styles.btnBottom}>
        <Button
          style={styles.button}
          label={state.isDetailedRead ? '📖 Đọc chi tiết' : '📡 Đọc dữ liệu'}
          onPress={() => onReadData()}
        />
      </View>
    </>
  );
};

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  serialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    height: CommonHeight,
    fontSize: CommonFontSize,
    borderColor: '#c3cde6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2f4f9d',
    backgroundColor: '#fff',
  },
  checkboxContainerActive: {
    backgroundColor: '#2f4f9d',
  },
  checkboxLabel: {
    marginLeft: 4,
    fontSize: normalize(13),
    color: '#2f4f9d',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: normalize(15),
    fontWeight: '700',
    marginVertical: 8,
    color: '#2f4f9d',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#e0e6f5',
  },
  infoLabel: {
    fontSize: normalize(14),
    color: '#444',
  },
  infoValue: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: '#000',
  },
  eventItem: {
    fontSize: normalize(13),
    marginBottom: 2,
    marginLeft: 4,
    color: '#333',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderColor: '#e0e6f5',
  },
  recordIndex: {
    width: 28,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: normalize(13),
    color: '#2f4f9d',
  },
  recordDate: {
    flex: 1,
    fontSize: normalize(13),
    color: '#555',
    marginHorizontal: 6,
  },
  recordValue: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: '#222',
  },
  btnBottom: {
    marginVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '75%',
    height: 50,
    maxWidth: 350,
    borderRadius: 10,
  },
});
