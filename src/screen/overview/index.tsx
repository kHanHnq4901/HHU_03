import React, { useState, useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  BackHandler,
  Linking,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { CircleSnail } from "react-native-progress";
import LinearGradient from "react-native-linear-gradient";
import { GetHookProps, hookProps, onDeInit, onInit, store } from "./controller";
import { onBleLongPress, onBlePress, onSavePress } from "./handleButton";
import SyncOverlay from "../../component/syncProgressBar";

const deviceWidth = Dimensions.get("window").width;
const itemSize = deviceWidth / 2 - 24;

export const OverViewScreen = () => {
  GetHookProps();
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState("");

  const MENU_ITEMS = [
    { label: "Đọc bán tự động", icon: "file-document-outline", subtitle: `Còn ${hookProps?.state?.statusCount[0] || 0} đồng hồ`, screen: "ManualRead", colors: ["#36D1DC", "#5B86E5"] },
    { label: "Đọc tự động", icon: "robot-outline", subtitle: `Còn ${hookProps?.state?.statusCount[0] || 0} đồng hồ`, screen: "AutomaticRead", colors: ["#11998e", "#38ef7d"] },
    { label: "Lấy danh sách", icon: "water", subtitle: "Tải dữ liệu từ DB", screen: "ImportMeter", colors: ["#2193b0", "#6dd5ed"] },
    { label: "Đồng bộ", icon: "sync", subtitle: `Lần cuối ${store.state.appSetting.timeSynchronization}`, isSync: true, colors: ["#4CAF50", "#81C784"] },
    { label: "Thống kê", icon: "chart-bar", subtitle: "Xem báo cáo", screen: "Statistics", colors: ["#FF9800", "#FFB74D"] },
    { label: "Thiết lập hệ thống", icon: "cog-outline", subtitle: "", screen: "SettingAndAlarm", colors: ["#8E24AA", "#BA68C8"] },
    { label: "Cấu hình HU", icon: "cellphone-link", subtitle: "", screen: "BoardBLE", colors: ["#E91E63", "#F48FB1"] },
    { label: "Cấu hình module", icon: "tune", subtitle: "", screen: "ConfigMeter", colors: ["#03A9F4", "#4FC3F7"] },
    { label: "Đọc dữ liệu", icon: "database-search", subtitle: "Xem dữ liệu thô", screen: "ReadDataMeter", colors: ["#607D8B", "#90A4AE"] },
    { label: "Hướng dẫn", icon: "book-open-page-variant", subtitle: "Xem cách sử dụng", isGuide: true, colors: ["#00BCD4", "#80DEEA"] },
    { label: "Đăng xuất", icon: "logout", subtitle: "Thoát hệ thống", screen: "Login", isLogout: true, colors: ["#FF5722", "#FF8A65"] },
    { label: "Thoát", icon: "exit-to-app", subtitle: "Đóng ứng dụng", isExit: true, colors: ["#795548", "#A1887F"] },
  ];

  const onPressItem = (item: any) => {
    if (progress > 0 && progress < 100) return;
    if (item.isLogout) {
      Alert.alert("Thông báo", "Bạn có muốn đăng xuất ?", [
        { text: "Hủy", style: "cancel" },
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }
    if (item.isExit) {
      BackHandler.exitApp();
      return;
    }
    if (item.isGuide) {
      Linking.openURL("https://emic.com.vn/");
      return;
    }
    if (item.isSync) {
      setProgress(0);
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setProgress(current);
        if (current >= 100) {
          clearInterval(interval);
          const now = new Date();
          const formattedTime = now.toLocaleString("vi-VN");
          store.setState((prev: any) => ({
            ...prev,
            appSetting: { ...prev.appSetting, timeSynchronization: formattedTime },
          }));
          Alert.alert("Thành công", "Đồng bộ hoàn tất!");
        }
      }, 50);
      onSavePress();
      return;
    }
    if (item.screen) navigation.navigate(item.screen);
  };

  useEffect(() => {
    onInit(navigation);
    return () => onDeInit();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚀 Tổng quan</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm kiếm chức năng..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* BLE */}
      <View style={styles.bleIconContainer}>
        <TouchableOpacity onLongPress={onBleLongPress} onPress={onBlePress} style={styles.bleButton}>
          {store?.state.hhu.connect === "CONNECTING" ? (
            <CircleSnail color={["#ff9800", "#03a9f4", "#4caf50"]} size={28} indeterminate thickness={1} />
          ) : (
            <Icon
              name={store?.state.hhu.connect === "CONNECTED" ? "bluetooth-connect" : "bluetooth-off"}
              size={26}
              color={store?.state.hhu.connect === "CONNECTED" ? "#4caf50" : "#888"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.filter((m) => m.label.toLowerCase().includes(search.toLowerCase())).map((item, index) => (
          <TouchableOpacity key={index.toString()} style={styles.card} activeOpacity={0.9} onPress={() => onPressItem(item)}>
            <LinearGradient colors={item.colors} style={styles.iconContainer}>
              <Icon name={item.icon} size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Overlay */}
      <SyncOverlay visible={progress > 0 && progress < 100} progress={progress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5", padding: 14 },
  header: { marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 8 },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bleIconContainer: { position: "absolute", top: 14, right: 14, zIndex: 10 },
  bleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 40 },
  card: {
    width: itemSize,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  menuLabel: { textAlign: "center", fontSize: 14, fontWeight: "600", color: "#1c1e21" },
  menuSubtitle: { textAlign: "center", fontSize: 12, color: "#65676b", marginTop: 4 },
});
