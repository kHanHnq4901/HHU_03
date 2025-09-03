import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  InputAccessoryView,
  Keyboard,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Button } from '../../component/button/button';
import { Text } from '../../component/Text';
import { Colors, CommonHeight, normalize, CommonFontSize } from '../../theme';
import { onReadData } from './handleButton';
import { hookProps, useHookProps } from './controller';
import { hook } from '../settingIPportScreen/controller';

const inputAccessoryViewID = 'uniqueID';

export const RealDataMeterScreen = () => {
  useHookProps();
  const [meterData, setMeterData] = useState<any>(null);

  const renderRecord = ({ item, index }: any) => (
    <View
      style={[
        styles.recordItem,
        { backgroundColor: index % 2 === 0 ? '#f9fbff' : '#fff' },
      ]}
    >
      <Text style={styles.recordDate}>{item.date}</Text>
      <Text style={styles.recordValue}>{item.value}</Text>
    </View>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <Button onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Nhập Serial */}
        <View style={styles.group}>
          <Text style={styles.label}>🔑 Serial thiết bị</Text>
          <TextInput
            placeholder="Nhập Serial VD: 123456789"
            value={hookProps.state.serial}
            style={styles.textInput}
            onChangeText={(text) =>
              hookProps.setState((prev) => ({ ...prev, serial: text }))
            }
          />
        </View>

        {/* Hiển thị kết quả */}
        {meterData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Kết quả đọc dữ liệu</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🔧 Serial</Text>
              <Text style={styles.infoValue}>{meterData.serial}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⏰ Thời gian</Text>
              <Text style={styles.infoValue}>{meterData.timestamp}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🔢 Chỉ số hiện tại</Text>
              <Text style={styles.infoValue}>{meterData.currentIndex}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🔋 Pin</Text>
              <Text style={styles.infoValue}>{meterData.battery}</Text>
            </View>

            <Text style={styles.sectionTitle}>📝 Các sự kiện</Text>
            {meterData.events.map((e: string, i: number) => (
              <Text key={i} style={styles.eventItem}>
                • {e}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>📂 90 bản ghi gần nhất</Text>
            <FlatList
              data={meterData.last90Records}
              keyExtractor={(item) => item.id}
              renderItem={renderRecord}
              style={styles.recordList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Button đọc dữ liệu */}
      <View style={styles.btnBottom}>
        <Button style={styles.button} label="Đọc dữ liệu" onPress={onReadData} />
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
  group: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#dfe6f2',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: normalize(15),
    marginBottom: 8,
    color: Colors.text,
    fontWeight: '600',
  },
  textInput: {
    width: '100%',
    height: CommonHeight,
    fontSize: CommonFontSize,
    borderColor: '#6e83e4',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: Colors.text,
    backgroundColor: '#fafbff',
  },
  card: {
    marginBottom: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f9fbff',
    borderWidth: 1,
    borderColor: '#d0defc',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    marginBottom: 14,
    color: '#2f4f9d',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: '#444',
  },
  infoValue: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: '#000',
  },
  sectionTitle: {
    fontSize: normalize(15),
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#2f4f9d',
  },
  eventItem: {
    fontSize: normalize(14),
    marginBottom: 4,
    marginLeft: 8,
    color: '#333',
  },
  recordList: {
    maxHeight: 250,
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e6f5',
    overflow: 'hidden',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  recordDate: {
    fontSize: normalize(13),
    color: '#555',
  },
  recordValue: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: '#222',
  },
  btnBottom: {
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '70%',
    height: 50,
    maxWidth: 350,
  },
});
