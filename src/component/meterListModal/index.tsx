import React from "react";
import { Modal, View, Text, FlatList, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface MeterListModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  meters: any[];
  selectedStatus: number | undefined;
  onReadMeter: (meterNo: string) => void;
  onShowData: (meterNo: string) => void;
  onNavigate: (meter: any) => void;
  onNavigateWithRoute?: (meter: any) => void;
}

export const MeterListModal: React.FC<MeterListModalProps> = ({
  visible,
  onClose,
  title,
  meters,
  selectedStatus,
  onReadMeter,
  onShowData,
  onNavigate,
  onNavigateWithRoute,
}) => {
  // lọc meter theo status
  const filteredMeters = meters.filter(m => {
    return m.STATUS == selectedStatus;

  });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: '90%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>{title}</Text>

          <FlatList
            data={filteredMeters}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => onNavigate(item)}>
                  <Text style={{ fontWeight: "600" }}>{item.LINE_NAME}</Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>
                    {item.METER_NO} - {item.CUSTOMER_NAME}
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                  <TouchableOpacity
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#2196F3", justifyContent: 'center', alignItems: 'center', marginLeft: 6 }}
                    onPress={() => onNavigateWithRoute?.(item)}
                  >
                    <MaterialCommunityIcons name="directions" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#4CAF50", justifyContent: 'center', alignItems: 'center', marginLeft: 6 }}
                    onPress={() => onReadMeter(item.METER_NO)}
                  >
                    <MaterialCommunityIcons name="access-point" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FF9800", justifyContent: 'center', alignItems: 'center', marginLeft: 6 }}
                    onPress={() => onShowData(item.METER_NO)}
                  >
                    <MaterialCommunityIcons name="file-document" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <TouchableOpacity style={{ marginTop: 10, backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={onClose}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

