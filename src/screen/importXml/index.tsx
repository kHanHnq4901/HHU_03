import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { FlatList, InputAccessoryView, Keyboard, Platform, StyleSheet, Text, View ,Button as RNButton, TextInput} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Caption, Divider } from 'react-native-paper';
import { BookServer } from '../../component/bookServer';
import { Button } from '../../component/button/button';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import { store } from '../../component/drawer/drawerContent/controller';
import LoadingModal from '../../component/loadingModal/index';
import { NormalTextInput } from '../../component/normalTextInput';
import { PropsFileInfo } from '../../shared/file';
import Theme, { Colors, Fonts, normalize, scaleHeight } from '../../theme';
import * as controller from './controller';
import * as handleButton from './handleButton';
import { onChangeTextSearch, onImportFromServerPress } from './handleButton';
import { DropdownComponent } from '../../component/dropdown';
import { throttle } from 'lodash';

const inputAccessoryViewID = 'uniqueID';

export const ImportXmlScreen = () => {
  const hookProps = controller.GetHookProps();
  const navigation = useNavigation();
  useEffect(() => {
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
    <View style={{flex: 1}}>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <RNButton onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}
      <LoadingModal
        task="Đang tải dữ liệu ..."
        modalVisible={hookProps.state.isBusy}
        // modalVisible={true}
      />
      {/* <Text style={styles.titleSelectSource}>Lấy dữ liệu từ server</Text> */}

      {

        loginMode === 'ĐL Hà Nội' && 
        <View style={styles.row} >
          <View style={{flex: 1}} >
            <NormalTextInput  label={'Mã đơn vị'} value={hookProps.state.infoDLHN.storage.maDonvi} 
                      onChangeText={text => {
                        hookProps.setState(state => {
                          state.infoDLHN.storage.maDonvi = text;
                          return {...state}
                        });
                      }}
                    ></NormalTextInput>
          </View>
            {
              (isCMIS === false) && 
              <View style={{flex: 1}} >
              <NormalTextInput selectTextOnFocus={false} label={'Mã đội'} value={hookProps.state.infoDLHN.storage.maDoi} 
                      onChangeText={text => {
                        hookProps.setState(state => {
                          state.infoDLHN.storage.maDoi = text;
                          return {...state}
                        });
                      }}
                    ></NormalTextInput>
                    </View>
            }
          {
              (isCMIS === true) && 
              <>
                <View style={{flex: 0.6}} >
                  <NormalTextInput 
                    keyboardType="numeric"
                    selectTextOnFocus={false}
                    inputAccessoryViewID={inputAccessoryViewID} 
                     label={'Kỳ'} value={hookProps.state.infoDLHN.storage.ky} 
                          onChangeText={text => {
                            hookProps.setState(state => {
                              state.infoDLHN.storage.ky = text;
                              return {...state}
                            });
                          }}
                  ></NormalTextInput>
                </View>
                
                <View style={{flex: 0.6}} >
                  <NormalTextInput
                    keyboardType="numeric"
                    inputAccessoryViewID={inputAccessoryViewID} 
                    selectTextOnFocus={false}
                    label={'Tháng'} value={hookProps.state.infoDLHN.storage.thang} 
                          onChangeText={text => {
                            hookProps.setState(state => {
                              state.infoDLHN.storage.thang = text;
                              return {...state}
                            });
                          }}
                  ></NormalTextInput>
                </View>
                <View style={{flex: 0.8}} >
                  <NormalTextInput  
                          keyboardType="numeric"
                          selectTextOnFocus={false}
                          inputAccessoryViewID={inputAccessoryViewID} 
                          label={'Năm'} value={hookProps.state.infoDLHN.storage.nam} 
                          onChangeText={text => {
                            hookProps.setState(state => {
                              state.infoDLHN.storage.nam = text;
                              return {...state}
                            });
                          }}
                  ></NormalTextInput>
                </View>

              </>
              
            }
            
          
          {/* <View style={{flex: 0.8}} >
            <Button
            style={{
              backgroundColor: Colors.purple,
              //flex: 1,
              // height: 50,
              // maxWidth: 150,
            }}
            label={hookProps.state.bookServerDLHN.length > 0 ?
              'Cập nhật sổ' : "Lấy sổ"}
            onPress={getMaSoDLHN}
          />
          </View> */}
          
 
        </View>


      }

      {
        false && loginMode === 'ĐL Hà Nội' && isCMIS === true && 
      
          <View
          style={{
            flexDirection: 'row',
            marginBottom: 3,
            flexWrap: 'wrap',
            alignItems: 'center',
            // justifyContent: 'center',
            zIndex: 1000,
            // backgroundColor: 'pink',
          }}>
            <View style={styles.dropdown}>
              <DropdownComponent
                onChange={itemObj => {
                  const val = itemObj.label;
                  hookProps.setState(state => {
                    state.infoDLHN.storage.loaiCS = val;
                    console.log('val:', val);
                    return { ...state };
                  });
                }}
                data={hookProps.state.infoDLHN.loaiCSDropDown}
                placeHolder="Loại CS"
                selectedValue={hookProps.state.infoDLHN.storage.loaiCS}
                
              />
            </View>
        
        </View>
 
      }
      
      <View style={styles.rowReserve}>
        
        
        <Button
          style={{
            backgroundColor: Colors.purple,
            flex: 1,
            height: 50,
            maxWidth: 150,
          }}
          label={loginMode === 'ĐL Hà Nội' ? 
          hookProps.state.bookServerDLHN.length > 0 ?
          'Cập nhật' : "Lấy từ server"
          :"Lấy từ server"}
          onPress={onImportFromServerPress}
        />

      </View>
      {
        loginMode === 'KH Lẻ' && (
          <>
            <Text style={styles.titleSelectSource}>Nhập dữ liệu từ file XML</Text>
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
                label="Nhập"
                onPress={handleButton.onImportPress}
              />
            </View>
          </>
        )
      }
      {
        loginMode === 'ĐL Hà Nội' && (
          <>
            
            {(!hookProps.state.dataServerDLHN)||(hookProps.state.dataServerDLHN.length === 0) ? (
              <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: 'bold' }}>Không có quyển nào</Text>
              </View>
            ) : (
              <>
                 <View style={styles.searchArea}>
                  <Text style={styles.commonTitle}>Tìm kiếm</Text>
                  <View style={{flex: 1}} >
                    <TextInput
                      style={styles.input}
                      placeholder='   mã quyển, mã NV'
                      placeholderTextColor={Colors.caption}
                      onChangeText={throttle(text => onChangeTextSearch(text), 250)}
                    />
                  </View>
                  <View>
                    <Text style={styles.commonTitle} >Thấy: {hookProps.state.searchFound}/{hookProps.state.searchTotal}</Text>
                  </View>
                  
                </View>
                <BookServer rowHeader={
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
                rowData={hookProps.state.bookServerDLHN}
                ></BookServer>
              </>
              
            )}
            <View style={styles.areaButton}>
              
              <Button
                style={{
                  backgroundColor: Theme.Colors.secondary,
                  flex: 1,
                  height: 50,
                  maxWidth: 150,
                }}
                label="Nhập"
                onPress={handleButton.onImportDLHNPress}
              />
            </View>
          </>
        )
      }
      
      {/* <Alert /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    flexGrow: 1,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 35 * scaleHeight,
    fontSize: normalize(17),
  },
  commonTitle: {
    fontSize: normalize(16),
    color: Colors.caption,
    marginHorizontal: 5,
  },
  dropdown: {
    maxWidth: 300,
    width: '40%',
    marginRight: 10,
    // height: CommonHeight,
    marginBottom: 15,
    elevation: 1,
    zIndex: 100,
  },

  inputDLHN: {
    flex: 1,
  },
  rowReserve: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems:'center',
  },
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
    // marginVertical: 20,
    marginBottom: 10,
    backgroundColor:'transparent',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  title: {
    fontSize: normalize(20),
    color: Colors.text,
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
  containerInfo: {
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 1,
    padding: 10,
  },
  containerSubInfo: {
    marginVertical: 10,
  },
  textInfo: {
    textAlign: 'right',
    color: Colors.primary,
    fontSize: normalize(16),
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5 * scaleHeight,
  },
});
