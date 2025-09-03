import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../../component/button/button';
import Theme, { Colors } from '../../theme';
import { GetHookProps, onDeInit, onInit, hookProps } from './controller';
import { handleGetData, toggleItem, toggleSelectAll, getFilteredList, handleSaveDataToDB } from './handleButton';
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
      {/* Top controls */}
      <LoadingOverlay visible={hookProps.state.isLoading} message={hookProps.state.textLoading} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelectAll(filteredList)}>
          <Icon
            name={
              hookProps.state.selectedItems.size === filteredList.length && filteredList.length > 0
                ? 'check-box' 
                : 'check-box-outline-blank'
            }
            size={26}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.countText}>
          Chọn: {hookProps.state.selectedItems.size}/{filteredList.length}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleGetData}>
          <Icon name="cloud-download" size={20} color="#fff" />
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" style={{ marginHorizontal: 8 }} />
        <TextInput
          placeholder="Tìm trạm ..."
          value={hookProps.state.searchText}
          onChangeText={txt => hookProps.setState(prev => ({ ...prev, searchText: txt }))}
          style={styles.searchInput}
        />
        {hookProps.state.searchText.length > 0 && (
          <TouchableOpacity onPress={() => hookProps.setState(prev => ({ ...prev, searchText: '' }))}>
            <Icon name="close" size={20} color="#888" style={{ marginHorizontal: 8 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item, index }) => {
          const globalIndex = hookProps.state.dataListLine.indexOf(item);
          const isChecked = hookProps.state.selectedItems.has(globalIndex);
          return (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => toggleItem(globalIndex)}
            >
              <Icon
                name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={Colors.primary}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>
                  Trạm : {item.LINE_ID} - {item.LINE_NAME} - {item.countMeter ?? 0} Đồng hồ
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>📭 Chưa có dữ liệu</Text>}
      />

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        <Button
          label="Nhập dữ liệu"
          style={[styles.btn, { backgroundColor: '#4CAF50' }]}
          textStyle={styles.textbtn}
          onPress={handleSaveDataToDB}
        />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.Colors.backgroundColor },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  checkbox: { marginRight: 10 },
  countText: { flex: 1, fontSize: 15, fontWeight: 'bold', color: Colors.primary },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1A73E8',
    borderRadius: 6,
  },
  refreshText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  itemTitle: { fontWeight: 'bold', fontSize: 16, color: '#1A73E8' },
  empty: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 14 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  btn: { height: 45, borderRadius: 8, elevation: 5 },
  textbtn: { color: '#fff', fontWeight: 'bold' },
});
