import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { throttle } from 'throttle-debounce';
import React, { useMemo } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button as RNButton,
  RefreshControl,
} from 'react-native';

import { Row, Rows, Table } from 'react-native-table-component';
import TextInputInteractive from 'react-native-text-input-interactive';
import { TextInputInteractive as CustomTextInputInteractive } from '../../component/TextInput/TextInputInteractive';
import { AutoCompleteInput } from '../../component/TextInputSugesstion';
import { Button } from '../../component/button/button';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import { store } from '../../component/drawer/drawerContent/controller';
import { DropdownComponent } from '../../component/dropdown';
import { RadioButton } from '../../component/radioButton/radioButton';
import { meterSpecies, SUPPORT_NSX } from '../../service/hhu/defineEM';
import Theme, {
  Colors,
  CommonFontSize,
  CommonHeight,
  Fonts,
  normalize,
  scale,
} from '../../theme';
import * as readParamsController from './controller';
import {
  GetHookProps,
  RadioButton_TypeReadableData,
  hookProps,
  itemTypeMeter,
  listNSX,
  onDeInit,
  onInit,
} from './controller';
import * as handleButton from './handleButton';
import { filterSeri, onEditSeriDone, onSelectDatePress, onTypeNSXChange } from './handleButton';
import AntDesign from 'react-native-vector-icons/AntDesign';
import _ from 'lodash';

const heightHeader = 20 * scale;

const RenderRadioButton = ({ e }: { e: RadioButton_TypeReadableData }) => {
  return useMemo(() => {
    return (
      <RadioButton
        key={e}
        label={e}
        value={e}
        checked={hookProps.state.typeRead === e ? true : false}
        onPress={() => {
          hookProps.setState(state => ({ ...state, typeRead: e }));
        }}
      />
    );
  }, [hookProps.state.typeRead]);
};

const RenderTable = React.memo(
  () => {
    return (
      <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
        {/* <Row
        data={readParamsController.dataHeaderTable}
        style={styles.head}
        textStyle={styles.headerTabel}
      /> */}
        <Rows
          // style={{ paddingVertical: 0, marginVertical: 0 }}
          data={hookProps.state.dataTable}
          textStyle={styles.text}
        />
      </Table>
    );
  },
  (prev, next) => prev === next,
);

const inputAccessoryViewID = 'uniqueID';

export const ReadParameterScreen = () => {
  GetHookProps();
  const navigation = useNavigation();

  React.useEffect(() => {
    onInit(navigation);

    return onDeInit;
  }, []);

  const isNot18G =
    hookProps.state.dropdown.meterSpecies.value !== meterSpecies.Repeater.id &&
    hookProps.state.dropdown.meterSpecies.value !== meterSpecies['CE-18G'].id;

  const isNotDcu =
    hookProps.state.dropdown.meterSpecies.value !== meterSpecies.Dcu.id;

  const isRepeater =
    hookProps.state.dropdown.meterSpecies.value === meterSpecies.Repeater.id;

  const isElster =
    hookProps.state.dropdown.meterSpecies.value === meterSpecies.Elster.id;

  const isOnePrice =
    hookProps.state.dropdown.meterSpecies.value === meterSpecies['CE-18'].id ||
    hookProps.state.dropdown.meterSpecies.value === meterSpecies['ME-40'].id;
  const isHHM =  hookProps.state.typeNSX === 'Hữu Hồng';
  const isGelex =  !isHHM;

  return (
    <View style={styles.container}>
      
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <RNButton onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}

      <View style={{
          flexDirection: 'row',
          marginBottom: 0,
          //justifyContent: '',
          paddingHorizontal: 10,
          alignItems:'center',
          //width: '100%',
        }} >
          <Text style={styles.caption} >Chọn nhà sản xuất:</Text>
          <View 
          style={{
            flexDirection: 'row',
            alignItems:'center',
            justifyContent:'space-around',
            flex: 1,
          }}
          >
            {
            listNSX.map((nsx, index) => <RadioButton 
              checked={hookProps.state.typeNSX === nsx} label={nsx === 'Hữu Hồng' ? 'Nhà khác' : nsx} key={index} value={nsx} 
              onPress={() => onTypeNSXChange(nsx)} ></RadioButton>)
          }
          </View>
          

      </View>

      <View
        style={{
          flexDirection: 'row',
          marginBottom: 0,
          //justifyContent: 'space-between',
          paddingRight: 10,
        }}>
        <View style={styles.containerSeri}>
          <AutoCompleteInput
            value={hookProps.state.seri}
            filter={filterSeri}
            onEditDone={onEditSeriDone}
            keyboardType="numeric"
            inputAccessoryViewID={inputAccessoryViewID}
            selectTextOnFocus={true}
            onChangeText={text =>
              hookProps.setState(state => ({ ...state, seri: text }))
            }
            onSelectedItem={item =>
              hookProps.setState(state => ({ ...state, seri: item }))
            }
            placeholder={!isRepeater ? 'Nhập số Seri' : 'Repeater'}
          />
        </View>
        {isRepeater && isGelex && (
          <View style={{ ...styles.containerSeri, marginLeft: 15 }}>
            <TextInputInteractive
              keyboardType="numeric"
              inputAccessoryViewID={inputAccessoryViewID}
              textInputStyle={styles.seri}
              placeholder={'Seri công tơ'}
              maxLength={12}
              value={hookProps.state.seri18G}
              placeholderTextColor={Colors.primary}
              onChangeText={text =>
                hookProps.setState(state => ({ ...state, seri18G: text }))
              }
            />
          </View>
        )}

        {isNot18G && !isElster && isNotDcu && isGelex && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'space-around',
              marginLeft: 15,
            }}>
            {itemTypeMeter.map(item => {
              return (
                <RadioButton
                  key={item.label}
                  label={item.label}
                  value={item.value as string}
                  checked={
                    hookProps.state.typeMeter === item.value ? true : false
                  }
                  onPress={() => {
                    hookProps.setState(state => ({
                      ...state,
                      typeMeter: item.value as unknown as null,
                    }));
                  }}
                />
              );
            })}
          </View>
        )}
        {((isNot18G && !isElster && isNotDcu) === false || isHHM) && (
          <View style={{ flexGrow: 1 }} />
        )}

        <TouchableOpacity
          style={styles.showControlTable}
          onPress={() => {
            hookProps.setState(state => {
              state.showControl = !state.showControl;
              return { ...state };
            });
          }}>
          <AntDesign
            name={hookProps.state.showControl ? 'up' : 'down'}
            size={18 * scale}
            color={Colors.purple}
          />
        </TouchableOpacity>
      </View>
      {hookProps.state.showControl && (
        <>
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
            { isGelex && <View style={styles.dropdown}>
              <DropdownComponent
                onChange={itemObj => {
                  const val = itemObj.value;
                  hookProps.setState(state => {
                    state.dropdown.meterSpecies.value = val;
                    //state.typeMeter = null;
                    state.typeData.items = [];
                    meterSpecies[val].allowTypeRead.forEach(item => {
                      state.typeData.items.push({
                        label: item.label,
                        value: item.value,
                        checked: false,
                      });
                    });

                    return { ...state };
                  });
                }}
                data={hookProps.state.dropdown.meterSpecies.items}
                placeHolder="Chọn công tơ"
                selectedValue={hookProps.state.dropdown.meterSpecies.value}
              />
            </View>}

            {isNot18G && isNotDcu && isGelex && (
              <View style={styles.selectTimeAnd0h}>
                <View style={{ width: '20%', alignItems: 'center' }}>
                  <CheckboxButton
                    label="1c"
                    checked={hookProps.state.is1c}
                    onPress={() =>
                      hookProps.setState(state => {
                        state.is1c = !state.is1c;
                        return { ...state };
                      })
                    }
                  />
                </View>

                {isNotDcu && (
                  <View
                    style={{
                      //flexDirection: 'row',
                      width: '80%',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '100%',
                        // backgroundColor: 'pink',
                      }}>
                      {(isOnePrice === false ||
                        store?.state.userRole === 'admin' ||
                        store?.state.userRole === 'dvkh') && (
                        <CheckboxButton
                          label="0h"
                          checked={hookProps.state.is0h}
                          onPress={() =>
                            hookProps.setState(state => {
                              state.is0h = !state.is0h;
                              return { ...state };
                            })
                          }
                        />
                      )}

                      {hookProps.state.is0h &&
                      (store?.state.userRole === 'admin' ||
                        store?.state.userRole === 'dvkh' ||
                        isOnePrice === false) ? (
                        Platform.OS === 'android' ? (
                          <TouchableOpacity
                            onPress={() => {
                              DateTimePickerAndroid.open({
                                value: hookProps.state.dateLatch,
                                mode: 'date',
                                display: 'calendar',
                                onChange: onSelectDatePress,
                              });
                            }}>
                            <CustomTextInputInteractive
                              label="Chọn ngày"
                              value={hookProps.state.dateLatch.toLocaleDateString(
                                'vi',
                              )}
                              onChangeText={() => {}}
                              //style={styles.searchText}
                              editable={false}
                              textInputStyle={styles.selectDate}
                            />
                          </TouchableOpacity>
                        ) : (
                          <DateTimePicker
                            value={hookProps.state.dateLatch}
                            mode="date"
                            onChange={onSelectDatePress}
                            locale="vi"
                            textColor={Colors.primary}
                            accentColor={Colors.primary}
                            style={{ minWidth: 100, marginLeft: 5 }}
                            themeVariant='light'
                          />
                        )
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
          {/* {hookProps.state.typeRead === 'Dữ liệu' ? (

      ) : null} */}

          <View style={styles.selectedTypeData}>
            {hookProps.state.typeData.items.map((item, index) => (
              <CheckboxButton
                key={item.label}
                label={item.label}
                checked={item.checked as boolean}
                onPress={() => {
                  hookProps.setState(state => {
                    state.typeData.items[index].checked =
                      !state.typeData.items[index].checked;
                    return { ...state };
                  });
                }}
                style={styles.checkBoxTypeData}
              />
            ))}
          </View>

          { isGelex && 
            <View style={styles.rowRadioButton}>
              {readParamsController.dataReadRadioButton.map(e => {
                // console.log('state', hookProps.state.typeRead);
                // console.log('e', e);
                return <RenderRadioButton e={e} key={e} />;
              })}

              {(store.state.userRole === 'admin' ||
                store.state.userRole === 'dvkh') && (
                <RenderRadioButton e="Khởi tạo" />
              )}
              {(store.state.userRole === 'admin' ||
                store.state.userRole === 'dvkh') && (
                <RenderRadioButton e="Reconnect" />
              )}
              {(store.state.userRole === 'admin' ||
                store.state.userRole === 'dvkh') && (
                <RenderRadioButton e="Đồng bộ RTC" />
              )}
            </View>
          }
          
        </>
      )}

      <Text style={styles.status}>{hookProps.state.status}</Text>
      <Table borderStyle={{ borderWidth: 1, borderColor: '#c8e1ff' }}>
        <Row
          data={readParamsController.dataHeaderTable}
          style={styles.head}
          textStyle={styles.headerTabel}
        />
      </Table>

      <ScrollView
        style={styles.table}
        refreshControl={
          <RefreshControl refreshing={hookProps.state.isReading} />
        }
        // onScroll={e => {
        //   // scrollY.value = e.nativeEvent.contentOffset.y;
        //   scrollY.setValue(e.nativeEvent.contentOffset.y);
        // }}
        // onScroll={handler}
      >
        <RenderTable />
      </ScrollView>
      <View style={styles.btnBottom}>
        {hookProps.state.isReading === false ? (
          <Button
            style={styles.button}
            label="Đọc"
            onPress={throttle(handleButton.onBtnReadPress, 1000)}
          />
        ) : (
          <Button
            style={styles.button}
            label={hookProps.state.requestStop ? 'Đang dừng ...' : 'Dừng'}
            onPress={() => {
              if (hookProps.state.requestStop === false) {
                hookProps.setState(state => {
                  state.requestStop = true;
                  return { ...state };
                });
              }
            }}
          />
        )}
      </View>
      {/* <Button style={styles.btnRead} label="Đọc" onPress={() => {}} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  caption: {
    color: Colors.caption,
    fontSize:normalize(14),
    fontFamily: Fonts
  },
  showControlTable: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 5,
  },
  listItemLabelDropdown: {
    fontFamily: Fonts,
    textAlignVertical: 'center',
    fontWeight: 'bold',
    // backgroundColor: 'pink',
  },
  labelDropdown: {
    fontFamily: Fonts,
    textAlignVertical: 'center',
    fontWeight: 'bold',
    textAlign: 'center',
    // color: 'white',
  },
  dropdownContainerList: {
    backgroundColor: Colors.backgroundColor,
    paddingTop: 15,
    zIndex: Number.MAX_VALUE,
    elevation: 3,
  },
  dropdownOwn: {
    backgroundColor: Colors.backgroundColor, //'#b8f68d', //'#f8daaf',
    borderWidth: 0.5,
    elevation: 1,
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
  status: {
    color: Theme.Colors.primary,
    fontSize: CommonFontSize,
    marginBottom: 3,
    textAlign: 'center',
  },
  button: {
    width: '40%',
    height: 45 * scale,
    alignSelf: 'center',
    maxWidth: 350,
  },
  checkBoxTypeData: {
    marginRight: 5,
    backgroundColor: '#f8daaf',
    borderRadius: 20,
    paddingHorizontal: 10,
    elevation: 1,
  },
  btnBottom: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rowRadioButton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  selectedTypeData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ebeef5',
    justifyContent: 'space-around',
    borderRadius: 10,
    marginBottom: 10,
  },
  table: {
    flex: 1,
    marginBottom: 10,
  },
  head: {
    height: normalize(25),
    backgroundColor: '#f1f8ff',
  },

  selectTimeAnd0h: {
    marginLeft: 0,
    marginTop: -10,
    flexDirection: 'row',
    alignItems: 'center',
    height: CommonHeight,
    //flexWrap: 'wrap',
    flex: 1,
    //justifyContent: 'space-around',
    //backgroundColor: 'pink',
  },
  selectDate: {
    //width: '80%',
    maxWidth: normalize(120),
    marginLeft: 0,
    minWidth: 100,
    //height: 38,
    color: Theme.Colors.primary,
    fontSize: CommonFontSize,
    height: CommonHeight,
    // position: 'absolute',
    // zIndex: 1,
  },
  text: {
    margin: 13,
    marginVertical: 10,
    fontSize: normalize(18),
    fontFamily: Fonts,
    color: 'black',
    // height: heightHeader,
    // fontWeight: 'bold',
  },
  headerTabel: {
    fontWeight: 'bold',
    fontSize: normalize(17),
    textAlign: 'center',
    fontFamily: Fonts,
    color: Colors.text,
  },
  seri: {
    fontSize: normalize(20),

    width: '100%',
    maxWidth: 300,
    //backgroundColor: 'pink',
    fontFamily: Fonts,
    height: 35 * scale,
    color: Colors.primary,
    backgroundColor: '#dde3f0',
    paddingVertical: 7,
    marginHorizontal: 3,
  },
  containerSeri: {
    width: '45%', //sizeScreen.width * 0.45,
    maxWidth: 300,
    // height: CommonHeight,
    // backgroundColor: 'pink',
    alignItems: 'center',
    borderRadius: 5,
    justifyContent: 'center',
    zIndex: Number.MAX_VALUE,
  },
  retries: {
    fontSize: 15,
    width: 70,
    //marginLeft: -50,
    fontFamily: Fonts,
    padding: 0,
    height: 35,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginVertical: 0,

    //maxWidth: 400,
    //elevation: 1,
  },
});
