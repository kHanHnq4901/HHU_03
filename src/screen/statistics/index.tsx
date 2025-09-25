import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { GetHookProps, hookProps } from "./controller";
import { useNavigation } from "@react-navigation/native";
import { LoadingOverlay } from "../../component/loading";

import { PieChart, BarChart } from "react-native-chart-kit";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

// Android bật LayoutAnimation
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const StatisticsScreen = () => {
  GetHookProps();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"success" | "error" | null>(null);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  const getStatusCounts = (lineId?: string) => {
    const meters = hookProps.state.listMeter.filter((m) =>
      lineId ? m.LINE_ID === lineId : true
    );
    const statusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    meters.forEach((m) => {
      const s = Number(m.STATUS);
      if (statusCounts.hasOwnProperty(s)) statusCounts[s] += 1;
    });
    return { total: meters.length, ...statusCounts };
  };

  const globalStats = getStatusCounts();

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedLine(expandedLine === id ? null : id);
  };

  const renderLineItem = ({ item }: { item: any }) => {
    const { total, 0: chuaDoc, 1: thanhCong, 2: loi, 3: ghiTay, 4: batThuong } =
      getStatusCounts(item.LINE_ID);

    const successRate = total > 0 ? Math.round((thanhCong / total) * 100) : 0;
    const expanded = expandedLine === item.LINE_ID;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleExpand(item.LINE_ID)}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{item.LINE_NAME[0]}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.LINE_NAME}</Text>
            <Text style={styles.cardCode}>
              Mã: {item.CODE} • Tổng: {total}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={22}
            color="#888"
          />
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${successRate}%` }]} />
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: "#555" }]}>
            <Ionicons name="locate" size={16} color="#fff" />
            <Text style={styles.badgeText}>{chuaDoc}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#2e7d32" }]}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.badgeText}>{thanhCong}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#d32f2f" }]}>
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text style={styles.badgeText}>{loi}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#f57c00" }]}>
            <Ionicons name="create" size={16} color="#fff" />
            <Text style={styles.badgeText}>{ghiTay}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#8e24aa" }]}>
            <Ionicons name="warning" size={16} color="#fff" />
            <Text style={styles.badgeText}>{batThuong}</Text>
          </View>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedTitle}>📊 Chi tiết</Text>
            <BarChart
              data={{
                labels: ["Chưa", "Thành công", "Thất bại ", "Ghi tay", "B.thường"],
                datasets: [{ data: [chuaDoc, thanhCong, loi, ghiTay, batThuong] }],
              }}
              width={700}
              height={180}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(44,62,80,${opacity})`,
              }}
              style={{ borderRadius: 12, marginTop: 10 }}
            />
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate("DetailLine", { line: item })}
            >
              <Text style={styles.detailBtnText}>Xem chi tiết ➝</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  let filteredList = hookProps.state.listLine.filter((l) =>
    l.LINE_NAME.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === "success") {
    filteredList = filteredList.sort(
      (a, b) =>
        getStatusCounts(b.LINE_ID)[1] - getStatusCounts(a.LINE_ID)[1]
    );
  } else if (sortBy === "error") {
    filteredList = filteredList.sort(
      (a, b) =>
        getStatusCounts(b.LINE_ID)[2] - getStatusCounts(a.LINE_ID)[2]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />

      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>📊 Dashboard Thống kê</Text>
          <TouchableOpacity style={styles.refreshBtn}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm kiếm line..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortBy === "success" && { backgroundColor: "#2e7d32" },
            ]}
            onPress={() => setSortBy(sortBy === "success" ? null : "success")}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.sortText}>Thành công</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortBy === "error" && { backgroundColor: "#d32f2f" },
            ]}
            onPress={() => setSortBy(sortBy === "error" ? null : "error")}
          >
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text style={styles.sortText}>Thất bại </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <LinearGradient colors={["#36D1DC", "#5B86E5"]} style={styles.kpiCard}>
          <Ionicons name="speedometer" size={26} color="#fff" />
          <Text style={styles.kpiValue}>{globalStats.total}</Text>
          <Text style={styles.kpiLabel}>Tổng đồng hồ</Text>
        </LinearGradient>
        <LinearGradient colors={["#11998e", "#38ef7d"]} style={styles.kpiCard}>
          <Ionicons name="checkmark-circle" size={26} color="#fff" />
          <Text style={styles.kpiValue}>{globalStats[1]}</Text>
          <Text style={styles.kpiLabel}>Thành công</Text>
        </LinearGradient>
        <LinearGradient colors={["#ff416c", "#ff4b2b"]} style={styles.kpiCard}>
          <Ionicons name="alert-circle" size={26} color="#fff" />
          <Text style={styles.kpiValue}>{globalStats[2]}</Text>
          <Text style={styles.kpiLabel}>Thất bại </Text>
        </LinearGradient>
      </View>

      {/* Pie Chart */}
      <Text style={styles.chartTitle}>📍 Phân bố trạng thái</Text>
      <PieChart
        data={[
          { name: "Chưa đọc", population: globalStats[0], color: "#555", legendFontColor: "#333", legendFontSize: 12 },
          { name: "Thành công", population: globalStats[1], color: "#2e7d32", legendFontColor: "#333", legendFontSize: 12 },
          { name: "Thất bại ", population: globalStats[2], color: "#d32f2f", legendFontColor: "#333", legendFontSize: 12 },
          { name: "Ghi tay", population: globalStats[3], color: "#f57c00", legendFontColor: "#333", legendFontSize: 12 },
          { name: "Bất thường", population: globalStats[4], color: "#8e24aa", legendFontColor: "#333", legendFontSize: 12 },
        ]}
        width={500}
        height={200}
        chartConfig={{ color: () => "#333" }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="16"
        absolute
      />

      {/* List */}
      <Text style={styles.chartTitle}>📋 Danh sách Line</Text>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.LINE_ID}
        renderItem={renderLineItem}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có trạm</Text>
          </View>
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: "#f0f2f5" },

  topHeader: { marginBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 10 },
  refreshBtn: {
    backgroundColor: "#4a90e2",
    padding: 8,
    borderRadius: 12,
  },

  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },

  sortRow: { flexDirection: "row", marginBottom: 10 },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#888",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  sortText: { color: "#fff", marginLeft: 6, fontWeight: "600" },

  kpiRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  kpiCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  kpiValue: { fontSize: 20, fontWeight: "700", color: "#fff" },
  kpiLabel: { fontSize: 13, color: "#fff", marginTop: 4 },

  chartTitle: { fontSize: 18, fontWeight: "700", marginVertical: 12, color: "#111" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#1c1e21" },
  cardCode: { fontSize: 13, color: "#65676b", marginTop: 2 },

  progressBar: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#2e7d32" },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", marginLeft: 5, fontSize: 14, fontWeight: "600" },

  expandedContent: { marginTop: 10 },
  expandedTitle: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  detailBtn: {
    marginTop: 10,
    backgroundColor: "#4a90e2",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  detailBtnText: { color: "#fff", fontWeight: "600" },

  emptyContainer: { padding: 20, alignItems: "center" },
  emptyText: { color: "#777", fontSize: 16 },
});
