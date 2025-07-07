import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import throttle from 'lodash.throttle';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../component/button/button';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import { StackWriteBookCodeNavigationProp } from '../../navigation/model/model';
import {
  CommonFontSize,
  CommonHeight,
  normalize,
  scaleHeight,
  sizeScreen,
} from '../../theme';
import { Colors } from '../../theme/index';
import { toLocaleDateString } from '../../util';
import {
  GetHookProps,
  PropsTabel,
  hookProps,
  onDeInit,
  onInit,
} from './controller';
import {
  onChangeTextSearch,
  onDropdownSelected,
  onOKPress,
  onSelectDatePress,
} from './handleButton';

type PropsRowHeader = {
  checked: boolean;
  title: string;
};

const RowHeader = (props: PropsRowHeader) => {
  const onPress = () => {
    hookProps.setState(state => {
      let checked = state.dataTabel[0].checked;
      state.dataTabel = state.dataTabel.map(item => {
        item.checked = !checked;
        return { ...item };
      });

      return { ...state };
    });
  };
  return (
    <View style={styles.containerRowTable}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.checkTabel}>
        <CheckboxButton
          uncheckedColor={Colors.blurPrmiary}
          checked={props.checked}
          onPress={onPress}
        />
        {/* <Checkbox
          uncheckedColor={Colors.primary}
          status={props.checked ? 'checked' : 'unchecked'}
        /> */}
      </TouchableOpacity>
      <View style={styles.contentTable}>
        <Text style={styles.title}>{props.title}</Text>
      </View>
    </View>
  );
};

const Row = (item: PropsTabel) => {
  const onPress = () => {
    hookProps.setState(state => {
      state.dataTabel = state.dataTabel.map(itm => {
        if (itm.id === item.id) {
          itm.checked = !itm.checked;
        }
        return { ...itm };
      });
      return { ...state };
    });
  }
  return (
    item.show && (
      <TouchableOpacity
        onPress={onPress}
        style={styles.containerRowTable}>
        <View style={styles.checkTabel}>
          {/* <Checkbox
            uncheckedColor={Colors.blurPrmiary}
            status={item.checked ? 'checked' : 'unchecked'}
          /> */}
          <CheckboxButton
            uncheckedColor={Colors.blurPrmiary}
            checked={item.checked}
            onPress={onPress}
          />
        </View>
        {/* <View
          style={{
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderTopWidth: 1,
            borderColor: Colors.border,
            paddingLeft: 15,
          }}>
          <Entypo name="open-book" size={25} color={Colors.primary} />
        </View> */}
        <View style={styles.contentTable}>
          <Text style={styles.title}>{item.bookCode}</Text>
          <View style={{ height: 10 }} />
          <Text style={styles.subTitle}>
            Mã NV: {item.listMaNV.join(',')}
          </Text>
          <Text style={styles.subTitle}>
            Đọc thành công: {item.succeedMeter}/ {item.totalMeter}
          </Text>
          <Text style={styles.subTitle}>
            Sản lượng: {item.capacityStation} kWh
          </Text>
        </View>
      </TouchableOpacity>
    )
  );
};

export const SelectBookCodeScreen = () => {
  GetHookProps();
  const navigation = useNavigation<StackWriteBookCodeNavigationProp>();

  const ref = React.useRef<SelectDropdown>(null);

  React.useEffect(() => {
    onInit(navigation, ref);
    return () => {
      onDeInit();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{hookProps.state.status}</Text>
      <View style={styles.selectSationAndInfo}>
        <View style={styles.containerSelectedStation}>
          <Text style={styles.titleStation}>Chọn trạm biến áp</Text>
          <View style={styles.dropdown}>
            <SelectDropdown
              data={hookProps.state.dropdownStationCode}
              ref={ref}
              defaultButtonText=" "
              //defaultValue=" "
              //defaultValueByIndex={0}
              onSelect={selectedItem => {
                //console.log(selectedItem, index);
                onDropdownSelected(selectedItem);
              }}
              buttonTextStyle={{ color: Colors.primary }}
              rowTextStyle={{ color: Colors.primary }}
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
                    size={20}
                    //color={Colors.secondary}
                  />
                );
              }}
              rowTextForSelection={(item, index) => {
                // text represented for each item in dropdown
                // if data array is an array of objects then return item.property to represent item in dropdown
                return item;
              }}
            />
          </View>
        </View>

        <View style={styles.containerInfo}>
          <View style={styles.containerSubInfo}>
            <Text style={styles.textInfo}>
              Tổng công tơ: {hookProps.state.totalMeter}
            </Text>
            <Text style={styles.textInfo}>
              Tổng BCS: {hookProps.state.totalBCS}
            </Text>
          </View>
          <View style={styles.containerSubInfo}>
            <Text style={styles.textInfo}>
              Tổng công tơ trạm: {hookProps.state.totalMeterStation}/{' '}
              {hookProps.state.totalMeter}
            </Text>
            <Text style={styles.textInfo}>
              Tổng BCS trạm: {hookProps.state.totalBCSStation}/{' '}
              {hookProps.state.totalBCS}
            </Text>
          </View>
          <View style={styles.containerSubInfo}>
            <Text style={styles.textInfo}>
              Sản lượng trạm: {hookProps.state.capacityStation} kWh
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',

          width: '100%',
          marginVertical: 15,
          paddingRight: 15,
          height: 45,
        }}>
        <View style={{ flex: 1 }} />
        <CheckboxButton
          label="Ghi Pmax"
          checked={hookProps.state.hasPmax}
          onPress={() =>
            hookProps.setState(state => {
              state.hasPmax = !state.hasPmax;
              return { ...state };
            })
          }
        />
        <CheckboxButton
          label="Ghi 0h"
          checked={hookProps.state.is0h}
          onPress={() =>
            hookProps.setState(state => {
              state.is0h = !state.is0h;
              return { ...state };
            })
          }
          uncheckedColor={Colors.blurPrmiary}
        />

        {hookProps.state.is0h ? (
          Platform.OS === 'android' ? (
            <TouchableOpacity
              // style={{ width: '30%', maxWidth: 100 }}
              onPress={() => {
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
                onChangeText={() => {}}
                //style={styles.searchText}
                editable={false}
                style={styles.selectDate}
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
      {/* <KeyboardAwareScrollView> */}
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
      {/* </KeyboardAwareScrollView> */}

      <View style={styles.containerTable}>
        <RowHeader
          checked={hookProps.state.checkAll}
          title="Danh sách mã quyển"
        />
        <ScrollView>
          {hookProps.state.dataTabel.map(item => {
            return <Row key={item.id} {...item} />;
          })}
        </ScrollView>
      </View>
      <View style={styles.btnArea}>
        <Button
          style={styles.btn}
          label="OK"
          onPress={() => {
            onOKPress(navigation);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectDate: {
    //width: '80%',
    maxWidth: normalize(120),
    //minWidth: 100,
    //height: 38,
    color: Colors.primary,
    fontSize: CommonFontSize,
    height: CommonHeight,
    //marginRight: -250,
    //backgroundColor: 'pink',
    borderRadius: 5,
    padding: 5,
    // position: 'absolute',
    // zIndex: 1,
  },
  container: {
    flex: 1,
    //paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btnArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
    width: '100%',
  },
  btn: {
    width: '30%',
    height: 40 * scaleHeight,
  },
  subTitle: {
    fontSize: normalize(16),
    color: Colors.blurPrmiary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    flexGrow: 1,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 35 * scaleHeight,
    fontSize: normalize(18),
  },
  status: {
    fontSize: normalize(16),
    color: Colors.primary,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  commonTitle: {
    fontSize: normalize(16),
    color: Colors.caption,
    marginHorizontal: 5,
  },
  selectSationAndInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  containerSelectedStation: {},
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
  titleStation: {
    color: Colors.caption,
    fontSize: normalize(17),
  },
  dropdown: {
    //width: sizeScreen.width * 0.3,
    alignItems: 'center',
    //backgroundColor: 'pink',
    marginTop: 20,
    //marginLeft: 35,
  },
  buttonDropDown: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: sizeScreen.width * 0.4,
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5 * scaleHeight,
  },
  containerTable: {
    marginTop: 10,
    flex: 1,
  },
  containerRowTable: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 10,
    //borderRadius: 15,
    //borderWidth: 1,
    //borderColor: Colors.primary,
  },
  checkTabel: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    //borderColor: Colors.primary,
  },
  contentTable: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'white',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  title: {
    fontSize: normalize(20),
    color: Colors.primary,
    marginVertical: 5,
    fontWeight: 'bold',
  },
});
