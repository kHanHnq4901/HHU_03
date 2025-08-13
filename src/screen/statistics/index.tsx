import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ProgressBarAndroid,
  TextInput,
} from 'react-native';
// Đảm bảo không gọi hook sai cách nếu không cần thiết
// import { GetHook, onDeInit, onInit } from './controller';
// import { useNavigation } from '@react-navigation/native';

export const StatisticsScreen = () => {
  // Nếu không sử dụng navigation thì không cần khai báo
  // const navigation = useNavigation();

  const [meters, setMeters] = React.useState<any[]>([]);
  const [filteredMeters, setFilteredMeters] = React.useState<any[]>([]);
  const [searchText, setSearchText] = React.useState('');
  const [selectedMeter, setSelectedMeter] = React.useState<any | null>(null);
  const [detailVisible, setDetailVisible] = React.useState(false);
  const [meterRecords, setMeterRecords] = React.useState<any[]>([]);

  React.useEffect(() => {
    //loadMockData();
  }, []);

  const loadMockData = () => {
    const mockMeters = [
      {
        METER_ID: '1',
        METER_NAME: 'Đồng hồ nước A1',
        METER_NO: 'A1-123456',
        CURRENT_INDEX: 1234.56,
        BATTERY: 85,
        EVENTS_COUNT: 3,
      },
      {
        METER_ID: '2',
        METER_NAME: 'Đồng hồ nước B2',
        METER_NO: 'B2-789012',
        CURRENT_INDEX: 789.12,
        BATTERY: 75,
        EVENTS_COUNT: 0,
      },
      {
        METER_ID: '3',
        METER_NAME: 'Đồng hồ nước C3',
        METER_NO: 'C3-456789',
        CURRENT_INDEX: 456.78,
        BATTERY: 60,
        EVENTS_COUNT: 2,
      },
    ];
    setMeters(mockMeters);
    setFilteredMeters(mockMeters);
  };

  const fetchMeterRecords = (meterId: string) => {
    const mockRecords = Array.from({ length: 90 }, (_, i) => ({
      VALUE: (Math.random() * 1000).toFixed(2),
      DATE: `2025-08-${(i % 30 + 1).toString().padStart(2, '0')} 08:00`,
    }));
    setMeterRecords(mockRecords);
  };

  const handleSelectMeter = (meter: any) => {
    setSelectedMeter(meter);
    fetchMeterRecords(meter.METER_ID);
    setDetailVisible(true);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredMeters(meters);
    } else {
      const filtered = meters.filter(
        (m) =>
          m.METER_NAME.toLowerCase().includes(text.toLowerCase()) ||
          m.METER_NO.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMeters(filtered);
    }
  };

  const renderMeterItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectMeter(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.METER_NO}</Text>
        <View
          style={[
            styles.eventBadge,
            { backgroundColor: item.EVENTS_COUNT > 0 ? '#ff4d4f' : '#52c41a' },
          ]}
        >
          <Text style={styles.eventText}>
            {item.EVENTS_COUNT > 0 ? `${item.EVENTS_COUNT} sự kiện` : 'Không sự kiện'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardSub}>Tên: {item.METER_NAME}</Text>
      <Text style={styles.cardSub}>Chỉ số hiện tại: {item.CURRENT_INDEX}</Text>
      <View style={styles.batteryContainer}>
        <Text style={styles.cardSub}>Pin: {item.BATTERY}%</Text>
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={typeof item.BATTERY === 'number' ? item.BATTERY / 100 : 0}
          color={item.BATTERY > 50 ? '#52c41a' : '#faad14'}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f4f6f8' }}>
      <Text style={styles.header}>Danh sách đồng hồ</Text>
      <TextInput
        placeholder="Tìm kiếm theo tên hoặc serial..."
        value={searchText}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />
      <FlatList
        data={filteredMeters}
        keyExtractor={(item) => item.METER_ID}
        renderItem={renderMeterItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#888' }}>Không tìm thấy đồng hồ</Text>
          </View>
        }
      />

      {/* Modal chi tiết */}
      <Modal visible={detailVisible} animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>90 bản ghi gần nhất</Text>
            <TouchableOpacity onPress={() => setDetailVisible(false)}>
              <Text style={styles.closeBtn}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }}>
            {Array.isArray(meterRecords) && meterRecords.length > 0 ? (
              meterRecords.map((rec, idx) => (
                <View key={idx} style={styles.recordItem}>
                  <Text style={styles.recordIndex}>{idx + 1}.</Text>
                  <Text style={styles.recordText}>
                    {rec.VALUE} <Text style={{ color: '#888' }}>({rec.DATE})</Text>
                  </Text>
                </View>
              ))
            ) : (
              <Text>Không có dữ liệu</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSub: { fontSize: 14, color: '#666', marginTop: 6 },
  eventBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  eventText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  batteryContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#007bff',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { color: '#fff', fontSize: 16 },
  recordItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordIndex: { fontWeight: 'bold', width: 30 },
  recordText: { fontSize: 14, color: '#333' },
});
