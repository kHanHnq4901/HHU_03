import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { hookProps, useHookProps } from "./controller";
import { LoadingOverlay } from "../../component/loading ";

export const DetailLineScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { line } = route.params;
  useHookProps(line.LINE_ID);

  const [filteredMeters, setFilteredMeters] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setFilteredMeters(hookProps.state.listMeter);
  }, [hookProps.state.listMeter]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredMeters(hookProps.state.listMeter.filter((m) => m.LINE_ID === line.LINE_ID));
    } else {
      setFilteredMeters(
        hookProps.state.listMeter.filter(
          (m) =>
            m.LINE_ID === line.LINE_ID &&
            (m.METER_NAME?.toLowerCase().includes(text.toLowerCase()) ||
              m.METER_NO?.toLowerCase().includes(text.toLowerCase()))
        )
      );
    }
  };

  const handleSelectMeter = (meter: any) => {
    navigation.navigate("DetailMeter", { meter }); // ✅ sang màn DetailMeter
  };


  const renderMeterItem = ({ item }: { item: any }) => {
    let bgColor = "#f1f1f1";
    let statusText = "Chưa đọc";
    let statusColor = "#888";
  
    switch (item.STATUS) {
      case "1": // thành công
        bgColor = "#d4edda";
        statusText = "Thành công";
        statusColor = "green";
        break;
      case "2": // thất bại
        bgColor = "#f8d7da";
        statusText = "Thất bại";
        statusColor = "red";
        break;
      case "3": // ghi tay
        bgColor = "#fff7e6";
        statusText = "Ghi tay";
        statusColor = "#ff9900";
        break;
      case "4": // bất thường
        bgColor = "#ffe6f0";
        statusText = "Bất thường";
        statusColor = "#d63384";
        break;
    }
  
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={() => handleSelectMeter(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.METER_NO}</Text>
          <Text style={[styles.statusBadge, { color: statusColor }]}>{statusText}</Text>
        </View>
        <Text style={styles.cardSub}>Khách hàng: {item.CUSTOMER_NAME}</Text>
        <Text style={styles.cardSub}>Mẫu: {item.METER_MODEL_DESC}</Text>
      </TouchableOpacity>
    );
  };
  

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f4f6f8" }}>
        <LoadingOverlay visible={hookProps.state.isLoading} message={hookProps.state.textLoading} />
      <Text style={styles.header}>Đồng hồ - {line.LINE_NAME}</Text>
      <TextInput
        placeholder="Tìm kiếm theo tên hoặc serial..."
        value={searchText}
        onChangeText={handleSearch}
        style={styles.searchInput}
      />
      <FlatList
        data={filteredMeters}
        keyExtractor={(item) => item.METER_NO}
        renderItem={renderMeterItem}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#888" }}>Không tìm thấy đồng hồ</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#333" },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  cardSub: { fontSize: 14, color: "#666", marginTop: 6 },
});
