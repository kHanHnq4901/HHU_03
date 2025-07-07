import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import throttle from 'lodash.throttle';
import React from 'react';
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
} from 'react-native';
import TextInput from 'react-native-text-input-interactive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../component/button/button';
import { StackWriteDataByBookCodeList } from '../../navigation/model/model';
import Theme, {
  Colors,
  CommonFontSize,
  CommonHeight,
  normalize,
  scale,
  sizeScreen,
} from '../../theme';
import {
  GetHook,
  getTableContent,
  hookProps,
  LabelDropdown,
  onBeforeInit,
  onDeInit,
  onInit,
} from './controller';
import {
  WhetherSaveImage,
  checkCondition,
  onChangeTypeMeterPress,
  onGoBackPress,
  onSelectDatePmaxPress,
  onSelectDatePress,
  onWriteByHandDone,
} from './handleButton';
import SelectDropdown from 'react-native-select-dropdown';
import { toLocaleDateString } from '../../util';
import { GetPicture } from '../../component/getPicture';
import { store } from '../../component/drawer/drawerContent/controller';
import { hook } from '../settingIPportScreen/controller';
import { ModalWriteRegister } from '../../component/modal/modalWriteRegister';

type Props = {
  label: string;
  content: string;
};

const RowTable = (props: Props) => {
  return (
    <View style={styles.rowTable}>
      <View style={styles.lableTable}>
        <Text style={styles.title1}>{props.label}</Text>
      </View>
      <View style={styles.contentTable}>
        <Text style={styles.title2}>{props.content}</Text>
      </View>
    </View>
  );
};
export type PropsData = Props[];
const inputAccessoryViewID = 'uniqueID';

export const WriteDataByHandScreen = () => {
  GetHook();
  const route =
    useRoute<RouteProp<StackWriteDataByBookCodeList, 'WriteByHand'>>();

  const props = route.params;

  

  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    //console.log('data:', props.data.data);
    onBeforeInit(props.data.data, props.data.isManyPrice);
  }, []);

  React.useEffect(() => {
    onInit(props.data.data);
    return onDeInit;
  }, []);

  

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <RNButton onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}
      <ModalWriteRegister
        title={store?.state.modal.modalAlert.title ?? ''}
        info={store?.state.modal.modalAlert.content ?? ''}
        onDismiss={store?.state.modal.modalAlert.onDissmiss}
        onOKPress={store?.state.modal.modalAlert.onOKPress}
      />
      <TouchableOpacity
        style={styles.backButton}
        onPress={()=>{
          onGoBackPress(navigation, props.data.data);
        }}>
        <Ionicons
          name="chevron-back"
          size={30 * scale}
          color={Colors.secondary}
        />
      </TouchableOpacity>
      <Text style={styles.NO}>{props.data.data.SERY_CTO}</Text>
      <Text style={styles.status}>{hookProps.state.status}</Text>
      {hookProps.state.isGelexMeter &&  <View style={styles.containerSelectedStation}>
        <Text style={styles.titleStation}>Chuyển kiểu công tơ</Text>
        <View style={styles.dropdown}>
          <SelectDropdown
            ref={hookProps.refTypeMeter}
            data={hookProps.state.dropdownStationCode}
            defaultButtonText=" "
            //defaultValue=" "
            //defaultValueByIndex={0}
            onSelect={selectedItem => {
              //console.log(selectedItem, index);
              //onDropdownSelected(selectedItem);
              const item = selectedItem as LabelDropdown;
              hookProps.setState(state => {
                state.selectedItemDropdown = item;
                return { ...state };
              });
            }}
            buttonTextStyle={{ color: Colors.text }}
            rowTextStyle={{ color: Colors.text }}
            buttonStyle={styles.buttonDropDown}
            buttonTextAfterSelection={(selectedItem, index) => {
              // text represented after item is selected
              // if data array is an array of objects then return selectedItem.property to render after item is selected
              return selectedItem;
            }}
            renderDropdownIcon={() => {
              return (
                <Ionicons
                  name="chevron-down"
                  size={20 * scale}
                  color={Colors.caption}
                />
              );
            }}
            rowTextForSelection={(item, index) => {
              // text represented for each item in dropdown
              // if data array is an array of objects then return item.property to represent item in dropdown
              return item;
            }}
          />
          <Button
            label="OK"
            style={{
              width: 100,
              alignSelf: 'center',
              height: 35,
              backgroundColor: 'white',
            }}
            textStyle={{ color: 'black' }}
            onPress={throttle(() => {
              onChangeTypeMeterPress(props.data);
            }, 1500)}
          />
        </View>
      </View>}
      <ScrollView>
        <View style={styles.body}>
          {hookProps.state.dataTable.map(item => (
            <RowTable
              key={item.label}
              label={item.label}
              content={item.content}
            />
          ))}
          <View style={{ marginTop: 15 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={styles.itemInputContainer}>
              <Text style={styles.title4}>Chỉ số mới:(kWh)</Text>
              <TextInput
                value={hookProps.state.CS_Moi}
                onChangeText={text => {
                  hookProps.setState(state => {
                    state.CS_Moi = text;
                    return { ...state };
                  });
                }}
                editable={hookProps.state.allowWrite}
                keyboardType="numeric"
                inputAccessoryViewID={inputAccessoryViewID}
                textInputStyle={styles.title3}
                placeholder="0"
                placeholderTextColor={Colors.primary}
              />
            </View>
            <View style={styles.itemInputContainer}>
              <Text style={styles.title4}>Ngày chốt:</Text>
              {Platform.OS === 'android' ? (
                <TouchableOpacity
                  style={styles.selectDate}
                  onPress={() => {
                    if (hookProps.state.allowWrite !== true) {
                      return;
                    }
                    DateTimePickerAndroid.open({
                      value: hookProps.state.dateLatch,
                      mode: 'date',
                      display: 'calendar',
                      onChange: onSelectDatePress,
                    });
                  }}>
                  <TextInput
                    placeholder="Chọn ngày"
                    value={toLocaleDateString(hookProps.state.dateLatch)}
                    textInputStyle={styles.title3}
                    //style={styles.searchText}
                    editable={false}
                    placeholderTextColor={Colors.primary}
                    //textInputStyle={styles.selectDate}
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
              )}
            </View>
            {props.data.isManyPrice && (
              <View style={styles.itemInputContainer}>
                <Text style={styles.title4}>Pmax:(kW)</Text>
                <TextInput
                  value={hookProps.state.Pmax}
                  onChangeText={text => {
                    hookProps.setState(state => {
                      state.Pmax = text;
                      return { ...state };
                    });
                  }}
                  editable={hookProps.state.allowWrite}
                  keyboardType="numeric"
                  inputAccessoryViewID={inputAccessoryViewID}
                  textInputStyle={styles.title3}
                  placeholder="0"
                  placeholderTextColor={Colors.primary}
                />
              </View>
            )}
            {props.data.isManyPrice && (
              <View style={styles.itemInputContainer}>
                <Text style={styles.title4}>Ngày Pmax:</Text>
                {Platform.OS === 'android' ? (
                  <TouchableOpacity
                    style={styles.selectDate}
                    onPress={() => {
                      if (hookProps.state.allowWrite !== true) {
                        return;
                      }
                      DateTimePickerAndroid.open({
                        value: hookProps.state.datePmax,
                        mode: 'date',
                        display: 'calendar',
                        onChange: onSelectDatePmaxPress,
                      });
                    }}>
                    <TextInput
                      placeholder="Chọn ngày"
                      value={toLocaleDateString(hookProps.state.datePmax)}
                      textInputStyle={styles.title3}
                      //style={styles.searchText}
                      editable={false}
                      placeholderTextColor={Colors.primary}
                      //textInputStyle={styles.selectDate}
                    />
                  </TouchableOpacity>
                ) : (
                  <DateTimePicker
                    value={hookProps.state.datePmax}
                    mode="date"
                    onChange={onSelectDatePmaxPress}
                    locale="vi"
                    textColor={Colors.primary}
                    accentColor={Colors.primary}
                    style={{ minWidth: 100, marginLeft: 5 }}
                    themeVariant='light'
                  />
                )}
              </View>
            )}
          </View>

          {
            true && (
              <>
                <GetPicture
                  images={hookProps.state.images}
                  onDeleteImages={image => {
                    hookProps.setState(state => {
                      state.images = state.images.filter(
                        img => img.fileName !== image.fileName,
                      );
                      return { ...state };
                    });
                  }}
                  onInsertImages={images => {
                    hookProps.setState(state => {
                      for (let image of images) {
                        state.images.push(image);
                      }
                      state.images = [...state.images];

                      return { ...state };
                    });
                  }}
                /> 
              </>
            )
          }
        

          <View>
            <Text style={styles.title4}>Ghi chú:</Text>
            <TextInput
              multiline
              autoCorrect={false}
              autoComplete="off"
              editable={hookProps.state.allowWrite}
              value={hookProps.state.ghichu}
              onChangeText={text => {
                hookProps.setState(state => {
                  state.ghichu = text;
                  return { ...state };
                });
              }}
              //keyboardType="numeric"
              textInputStyle={{
                ...styles.title2,
                height: normalize(100),
                textAlign: 'left',
                textAlignVertical: 'top',
                backgroundColor: '#f0ebec',
                borderWidth: 1,
                color: Colors.primary,
              }}
              placeholder="..."
              placeholderTextColor={Colors.primary}
            />
          </View>
        </View>
        
        <View style={{height: 30}}></View>
      </ScrollView>
      {hookProps.state.allowWrite && (
        <View style={styles.buttonArea}>
          <Button
            label={hookProps.state.isWriting ? 'Đang ghi' : 'Ghi'}
            style={{ width: '50%', alignSelf: 'center', height: 55 }}
            onPress={throttle(() => {
              const ok = checkCondition(props.data.isManyPrice);
              if (ok) {
                onWriteByHandDone(props.data);
              }
            }, 1500)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerSelectedStation: {
    width: '50%',
    //alignSelf: 'flex-end',
    marginLeft: 15,
  },
  containerInfo: {
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 1,
    padding: 10,
  },
  buttonDropDown: {
    backgroundColor: Colors.backgroundIcon,
    borderRadius: 15,
    width: sizeScreen.width * 0.4,
  },
  titleStation: {
    color: Colors.caption,
    fontSize: normalize(17),
  },
  dropdown: {
    //width: sizeScreen.width * 0.3,
    alignItems: 'center',
    //backgroundColor: 'pink',
    marginTop: 20,
    flexDirection: 'row',
    //marginLeft: 35,
  },
  buttonArea: {
    marginVertical: 10,
    //width: '50%',
    //alignItems: 'center',
  },
  selectDate: {
    height: CommonHeight,
  },
  itemInputContainer: {
    marginRight: 10,
  },
  rowTable: {
    flexDirection: 'row',
  },
  title3: {
    color: Colors.primary,
    fontSize: normalize(18),
    marginVertical: 5,
    width: 150 * scale,
    backgroundColor: '#f0ebec',
    height: CommonHeight,
  },
  lableTable: {
    width: '20%',
    borderWidth: 1,
    borderColor: '#dadadd',
    paddingHorizontal: 3,
    color: Colors.text,
  },
  contentTable: {
    flex: 1,
    //borderWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: '#dadadd',
    paddingHorizontal: 3,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.backgroundColor,
  },
  title: {
    fontSize: normalize(24),
    margin: 10,
    alignSelf: 'center',
    color: Colors.text,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 15,
    width: 30 * scale,
    height: 40 * scale,
    borderRadius: 30,
    backgroundColor: 'white',
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  NO: {
    color: 'black',
    fontSize: normalize(28),
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  title1: {
    fontSize: normalize(18),
    marginVertical: 5,
    color: Colors.text,
  },
  title2: {
    color: Colors.text,
    fontSize: normalize(18),
    marginVertical: 5,
  },
  title4: {
    color: Colors.text,
    fontSize: normalize(20),
    marginVertical: 5,
  },
  status: {
    color: Colors.primary,
    marginVertical: 3,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: CommonFontSize,
  },
});
