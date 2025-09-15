import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from "react-native";
import { GetHookProps,hookProps } from "./controller";
import { useNavigation } from "@react-navigation/native";
import { LoadingOverlay } from "../../component/loading ";

export const StatisticsScreen = () => {
  GetHookProps();
  const navigation = useNavigation();

  const getStatusCounts = (lineId: string) => {
    const meters = hookProps.state.listMeter.filter((m) => m.LINE_ID === lineId);
    const statusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    meters.forEach((m) => {
      const s = Number(m.STATUS);
      if (statusCounts.hasOwnProperty(s)) {
        statusCounts[s] += 1;
      }
    });
    return { total: meters.length, ...statusCounts };
  };

  const handleSelectLine = (line: any) => {
    navigation.navigate("DetailLine", { line });
  };

  const renderLineItem = ({ item }: { item: any }) => {
    const { total, 0: chuaDoc, 1: thanhCong, 2: loi, 3: ghiTay, 4: batThuong } =
      getStatusCounts(item.LINE_ID);

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelectLine(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.LINE_NAME}</Text>
          <Text style={styles.cardCode}>Mã: {item.CODE}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.total}>Tổng: {total}</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.status, { color: "#888" }]}>Chưa đọc: {chuaDoc}</Text>
            <Text style={[styles.status, { color: "green" }]}>Thành công: {thanhCong}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.status, { color: "red" }]}>Thất bại: {loi}</Text>
            <Text style={[styles.status, { color: "#ff9900" }]}>Ghi tay: {ghiTay}</Text>
            <Text style={[styles.status, { color: "#d63384" }]}>Bất thường: {batThuong}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <LoadingOverlay visible={hookProps.state.isLoading} message={hookProps.state.textLoading} />
      <Text style={styles.header}>Danh sách trạm</Text>
      <FlatList
        data={hookProps.state.listLine}
        keyExtractor={(item) => item.LINE_ID}
        renderItem={renderLineItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có trạm</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f6f8" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#333" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  cardCode: { fontSize: 13, color: "#555" },
  statusContainer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  total: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  status: { fontSize: 13, flex: 1 },
  emptyContainer: { padding: 20, alignItems: "center" },
  emptyText: { color: "#888" },
});
