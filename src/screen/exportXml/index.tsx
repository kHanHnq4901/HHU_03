import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Caption, Checkbox, Divider } from 'react-native-paper';
import { Button } from '../../component/button/button';
import { Text } from '../../component/Text';
import { PropsFileInfo } from '../../shared/file';
import Theme, { Colors, Fonts, normalize } from '../../theme';
import * as controller from './controller';
import * as handleButton from './handleButton';
import LoadingModal from '../../component/loadingModal';
import { onExportFromServerPress } from './handleButton';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import { store } from '../../component/drawer/drawerContent/controller';
import { BookPushServer } from '../../component/bookPushServerDLHN';

export const ExportXmlScreen = () => {
  const hookProps = controller.GetHookProps();
  const navigation = useNavigation();
  React.useEffect(() => {
    controller.onInit(navigation);
    return controller.onDeInit;
  }, []);

  const RenderItem = ({ item }: { item: PropsFileInfo }) => {
    // return useMemo(
    //   () => (

    return (
      <TouchableOpacity
        onPress={() => {
          hookProps.setState(state => {
            state.xmlList.forEach(e => {
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

  const loginMode = store.state.appSetting.loginMode;
  const isCMIS = store.state.appSetting.isCMISDLHN;

  return (
    <View style={Theme.StyleCommon.container}>
      <LoadingModal
        task="Đang xử lý ..."
        modalVisible={hookProps.state.isBusy}
        //modalVisible={true}
      />
      <Text style={styles.titleSelectSource}>Xuất dữ liệu lên server</Text>
      <View style={styles.rowReserve}>
        <Button
          style={{
            backgroundColor: Colors.purple,
            flex: 1,
            height: 50,
            maxWidth: 150,
          }}
          label="Xuất"
          onPress={onExportFromServerPress}
        />
      </View>

      {
        (loginMode === 'KH Lẻ' || loginMode === 'NPC' )&& (
          <>
            <Text style={styles.titleSelectSource}>Xuất dữ liệu từ file XML</Text>
            {hookProps.state.xmlList.length === 0 ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 45, fontWeight: 'bold' }}>Trống</Text>
              </View>
            ) : (
              <FlatList
                data={hookProps.state.xmlList}
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

      {
        loginMode === 'ĐL Hà Nội' && (
          <>
            
            {(!hookProps.state.bookPushServerDLHN)||(hookProps.state.bookPushServerDLHN.length === 0) ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: 'bold' }}>Không có quyển nào</Text>
              </View>
            ) : (
              <BookPushServer rowHeader={
                {
                  checked: false,
                  onCheckedChange: () => {
                    // hookProps.setState(state => {
                    //   let checked = state.bookServerDLHN[0].checked;
                    //   console.log('checked:', checked);
                      
                    //   state.bookServerDLHN = state.bookServerDLHN.map(item => {
                    //     item.checked = !checked;
                    //     return { ...item };
                    //   });
          
                    //   return { ...state };
                    // });
                  },
                  title: 'Danh sách sổ'
                }
                
              } 
              rowData={hookProps.state.bookPushServerDLHN}
              ></BookPushServer>
            )}
            
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
