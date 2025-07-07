import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet, View, ScrollView, FlatList } from 'react-native';
import * as controller from './controller';
import Theme, { CommonHeight, normalize } from '../../theme';
import { Button } from '../../component/button/button';
import { Caption, Checkbox, Divider } from 'react-native-paper';
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as handleButton from './handleButton';
import  {CustomAlert}  from '../../component/alert';
import { PropsFileInfo } from '../../shared/file';
import { CheckboxButton } from '../../component/checkbox/checkbox';

export const ImportExportCSDLScreen = () => {
  const hookProps = controller.GetHookProps();


  useEffect(() => {
    controller.onInit();
    return controller.onDeInit;
  }, []);

  
  const RenderItem = ({ item }: { item: PropsFileInfo }) => {
    // return useMemo(
    //   () => (

    return (
      <TouchableOpacity
        onPress={() => {
          hookProps.setState(state => {
            state.csdlList.forEach(e => {
              if (e.name === item.name) {
                e.checked = !e.checked;
                //console.log(state);
              }
            });
            return { ...state };
          });
        }}>
        {/* <Divider /> */}
        <View style={styles.row}>
          <CheckboxButton
            checked={item.checked}
            label={item.name}
            onPress={() => {}}
          />
          <View style={styles.dateTimeItem}>
            <Caption>{item.date}</Caption>
          </View>
          {/* <MaterialCommunityIcons
          name="xml"
          color={Theme.Colors.secondary}
          size={20}
        /> */}
        </View>
        <Divider />
      </TouchableOpacity>
    );
    //   ),
    //   [item.checked, item.name],
    // );
  };


  return (
    <View style={Theme.StyleCommon.container}>
      <View style={{...styles.areaButton, marginVertical: 0}}>
        <View style={styles.buttonExport}>
          <Button
            style={{
              backgroundColor: '#f5c946',
              height: 50,
              maxWidth: 150,
            }}
            label="Tạo sao lưu"
            onPress={handleButton.OnCreateBackupPress}
          />
        </View>
        <View style={styles.buttonExport}>
          <Button
            style={{
              backgroundColor: Theme.Colors.secondary,
              height: 50,
              maxWidth: 150,
            }}
            label="Xuất"
            onPress={handleButton.onExportPress}
          />
        </View>
      </View>
      
      {hookProps.state.csdlList.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 45, fontWeight: 'bold' }}>Trống</Text>
        </View>
      ) : (
        <FlatList
          data={hookProps.state.csdlList}
          renderItem={RenderItem}
          keyExtractor={item => item.name}
        />
      )}
      <View style={styles.areaButton}>
        <Button
          label="Xóa"
          onPress={handleButton.onDeleteFilePress}
          style={{ flex: 1, height: 50, maxWidth: 150 }}
        />
        <Button
          style={{
            backgroundColor: Theme.Colors.secondary,
            flex: 1,
            height: 50,
            maxWidth: 150,
          }}
          label="Khôi phục"
          onPress={handleButton.onImportPress}
        />
      </View>
      <CustomAlert visible={false} onClose={function (): void {
        throw new Error('Function not implemented.');
      } } />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 15,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  areaButton: {
    flexDirection: 'row',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dateTimeItem: {
    marginRight: 15,
    height: CommonHeight,
    justifyContent: 'center',
  },
  buttonExport: { width: '35%', alignSelf: 'flex-end', marginBottom: 30 },
});
