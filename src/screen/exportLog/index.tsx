import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Caption, Divider } from 'react-native-paper';
import { Text } from '../../component/Text';
import { Button } from '../../component/button/button';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import LoadingModal from '../../component/loadingModal';
import { PropsFileInfo } from '../../shared/file';
import Theme, { Colors, Fonts, normalize } from '../../theme';
import * as controller from './controller';
import * as handleButton from './handleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackExportLogList } from '../../navigation/model/model';

export const ExportLogScreen = () => {
  const hookProps = controller.GetHookProps();
  const navigation = useNavigation<NavigationProp<StackExportLogList>>();
  React.useEffect(() => {
    controller.onInit(navigation);
    return controller.onDeInit;
  }, []);

  const RenderItem = ({ item }: { item: PropsFileInfo }) => {
    // return useMemo(
    //   () => (

    return (
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}} >
      <TouchableOpacity
        style={{flex: 1}}
        onPress={() => {
          hookProps.setState(state => {
            state.logList.forEach(e => {
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
          
          
        </View>
        <Divider />
      </TouchableOpacity>
      <Pressable  onPress={
            () => {
              navigation.navigate('ViewLogDetail', item);
            }
          } >
            <Ionicons
              name="eye"
              color={Theme.Colors.secondary}
              size={25}
            />
          </Pressable>
      </View>
    );
    //   ),
    //   [item.checked, item.name],
    // );
  };

  return (
    <View style={Theme.StyleCommon.container}>
      <LoadingModal
        task="Đang tải dữ liệu ..."
        modalVisible={hookProps.state.isBusy}
        // modalVisible={true}
      />
      
      {
        true && (
          <>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}} >
              <Text style={styles.titleSelectSource}>Danh sách Log</Text>
              <CheckboxButton
                checked={hookProps.state.iSelectedAll}
                label={hookProps.state.iSelectedAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                onPress={() => {
                  const isSlectedAll = !hookProps.state.iSelectedAll;
                  hookProps.setState(state => {
                    state.logList.forEach(item => item.checked = isSlectedAll);
                    state.iSelectedAll = isSlectedAll;
                    return {...state}
                  });
                }}
              />
            </View>
            
            {hookProps.state.logList.length === 0 ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 45, fontWeight: 'bold' }}>Trống</Text>
              </View>
            ) : (
              <FlatList
                data={hookProps.state.logList}
                renderItem={RenderItem}
                keyExtractor={item => item.name}
              />
            )}
            <View style={styles.areaButton}>
              <Button
                style={{ flex: 1, height: 50, maxWidth: 150 }}
                label="Xóa"
                onPress={handleButton.onDeleteFilePress}
              />
              <Button
                style={{
                  backgroundColor: Theme.Colors.secondary,
                  flex: 1,
                  height: 50,
                  maxWidth: 150,
                }}
                label="Chia sẻ"
                onPress={handleButton.onExportPress}
              />
            </View>
          </>
        )
      }
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeItem: {
    marginRight: 15,
  },
  areaButton: {
    flexDirection: 'row',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  title: {
    fontSize: normalize(20),
    color: 'black',
  },
  titleSelectSource: {
    fontSize: normalize(20),
    color: Colors.caption,
    fontFamily: Fonts,
    // textAlign: 'center',
    marginBottom: 15,
    marginTop: 15,
    paddingHorizontal: 20,
  },
  rowReserve: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
});
