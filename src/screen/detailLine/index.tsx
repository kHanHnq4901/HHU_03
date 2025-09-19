import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { hookProps, useHookProps } from "./controller";
import { LoadingOverlay } from "../../component/loading ";
import Ionicons from "react-native-vector-icons/Ionicons";

export const DetailLineScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { line } = route.params;
  useHookProps(line.LINE_ID);

  const [filteredMeters, setFilteredMeters] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const statusMap: Record<string, any> = {
    all: { text: "Tất cả", color: "#607d8b", icon: "apps" },
    "0": { text: "Chưa đọc", color: "#9e9e9e", icon: "time" },
    "1": { text: "Thành công", color: "#2e7d32", icon: "checkmark-circle" },
    "2": { text: "Thất bại", color: "#d32f2f", icon: "alert-circle" },
    "3": { text: "Ghi tay", color: "#f57c00", icon: "create" },
    "4": { text: "Bất thường", color: "#8e24aa", icon: "warning" },
  };

  useEffect(() => {
    setFilteredMeters(
      hookProps.state.listMeter.filter((m) => m.LINE_ID === line.LINE_ID)
    );
  }, [hookProps.state.listMeter]);

  const filteredList = useMemo(() => {
    return hookProps.state.listMeter.filter((m) => {
      if (m.LINE_ID !== line.LINE_ID) return false;

      const matchSearch =
        m.METER_NAME?.toLowerCase().includes(searchText.toLowerCase()) ||
        m.METER_NO?.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus =
        filterStatus === "all" ? true : m.STATUS === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [hookProps.state.listMeter, searchText, filterStatus]);

  const handleSelectMeter = (meter: any) => {
    navigation.navigate("DetailMeter", { meter });
  };

  const renderMeterItem = ({ item }: { item: any }) => {
    const statusConfig = statusMap[item.STATUS] || statusMap["0"];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectMeter(item)}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.METER_NO}</Text>
          <View
            style={[styles.badge, { backgroundColor: statusConfig.color }]}
          >
            <Ionicons name={statusConfig.icon} size={16} color="#fff" />
            <Text style={styles.badgeText}>{statusConfig.text}</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.cardSub}>Khách hàng :  {item.CUSTOMER_NAME}</Text>
        <Text style={styles.cardSub}>Loại đồng hồ :  {item.METER_MODEL_DESC}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 14, backgroundColor: "#f0f2f5" }}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />

      <Text style={styles.header}>📋 Đồng hồ - {line.LINE_NAME}</Text>

      {/* Search box */}
      <TextInput
        placeholder="🔍 Tìm kiếm theo tên hoặc serial..."
        value={searchText}
        onChangeText={setSearchText}
        style={styles.searchInput}
      />

      {/* Filter status */}
      <View style={styles.filterRow}>
        {Object.keys(statusMap).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterChip,
              filterStatus === key && {
                backgroundColor: statusMap[key].color,
              },
            ]}
            onPress={() => setFilterStatus(key)}
          >
            <Ionicons
              name={statusMap[key].icon}
              size={14}
              color={filterStatus === key ? "#fff" : statusMap[key].color}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterText,
                filterStatus === key && { color: "#fff", fontWeight: "700" },
              ]}
            >
              {statusMap[key].text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.METER_NO}
        renderItem={renderMeterItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={28} color="#999" />
            <Text style={styles.emptyText}>Không tìm thấy đồng hồ</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  filterText: {
    fontSize: 13,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1c1e21" },
  cardSub: { fontSize: 14, color: "#555", marginTop: 6 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", marginLeft: 6, fontWeight: "600", fontSize: 13 },

  emptyContainer: { padding: 30, alignItems: "center" },
  emptyText: { color: "#777", fontSize: 16, marginTop: 8 },
});
