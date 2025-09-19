import React, { useEffect, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from '../../component/button/button';
import Theme, { Colors } from '../../theme';
import {
  GetHookProps,
  onDeInit,
  onInit,
  hookProps,
} from './controller';
import {
  handleGetData,
  toggleItem,
  toggleSelectAll,
  getFilteredList,
  handleSaveDataToDB,
} from './handleButton';
import { LoadingOverlay } from '../../component/loading ';

export const ImportMeterScreen = () => {
  GetHookProps();

  useEffect(() => {
    onInit();
    return onDeInit();
  }, []);

  const filteredList = useMemo(() => {
    return getFilteredList();
  }, [hookProps.state.dataListLine, hookProps.state.searchText]);

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />

      {/* Top controls */}
      <LinearGradient
        colors={['#1A73E8', '#4CAF50']}
        style={styles.topBar}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleSelectAll(filteredList)}
        >
          <Icon
            name={
              hookProps.state.selectedItems.size === filteredList.length &&
              filteredList.length > 0
                ? 'check-box'
                : 'check-box-outline-blank'
            }
            size={26}
            color={'#fff'}
          />
        </TouchableOpacity>
        <Text style={styles.countText}>
          {hookProps.state.selectedItems.size}/{filteredList.length} đã chọn
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleGetData}>
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={22} color="#555" style={{ marginHorizontal: 8 }} />
        <TextInput
          placeholder="Tìm trạm theo tên..."
          placeholderTextColor="#aaa"
          value={hookProps.state.searchText}
          onChangeText={(txt) =>
            hookProps.setState((prev) => ({ ...prev, searchText: txt }))
          }
          style={styles.searchInput}
        />
        {hookProps.state.searchText.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              hookProps.setState((prev) => ({ ...prev, searchText: '' }))
            }
          >
            <Icon
              name="close"
              size={20}
              color="#888"
              style={{ marginHorizontal: 8 }}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 90 }}
        renderItem={({ item }) => {
          const globalIndex = hookProps.state.dataListLine.indexOf(item);
          const isChecked = hookProps.state.selectedItems.has(globalIndex);

          return (
            <TouchableOpacity
              style={[
                styles.item,
                isChecked && {
                  backgroundColor: '#E8F5E9',
                  borderColor: Colors.primary,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => toggleItem(globalIndex)}
            >
              <View style={styles.itemIcon}>
                <Icon
                  name="account-balance"
                  size={28}
                  color={isChecked ? Colors.primary : '#777'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>
                  {item.LINE_NAME}
                </Text>
                <Text style={styles.itemSub}>
                  Mã trạm: {item.LINE_ID} • Đồng hồ: {item.countMeter ?? 0}
                </Text>
              </View>
              <Icon
                name={isChecked ? 'check-circle' : 'radio-button-unchecked'}
                size={22}
                color={isChecked ? Colors.primary : '#bbb'}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>📭 Chưa có dữ liệu</Text>
        }
      />

      {/* Bottom action */}
      <LinearGradient
        colors={['#4CAF50', '#1A73E8']}
        style={styles.bottomBar}
      >
        <Button
          label="📥 Nhập dữ liệu"
          style={styles.btn}
          textStyle={styles.textbtn}
          onPress={handleSaveDataToDB}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.backgroundColor },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 6,
  },
  checkbox: { marginRight: 12 },
  countText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  refreshText: { color: '#fff', fontWeight: '600', marginLeft: 4 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 8,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginVertical: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: { fontWeight: '600', fontSize: 15, color: '#222' },
  itemSub: { fontSize: 13, color: '#666', marginTop: 2 },

  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 15,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    elevation: 8,
  },
  btn: { height: 52, borderRadius: 12 },
  textbtn: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
