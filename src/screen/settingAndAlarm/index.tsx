import React from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Button as RNButton,
} from 'react-native';
import TextInputInteractive from 'react-native-text-input-interactive';
import { Button } from '../../component/button/button';
import { RadioButton } from '../../component/radioButton/radioButton';
import { Text } from '../../component/Text';
import Loader3 from '../../component/loader3';
import {
  Colors,
  CommonHeight,
  normalize,
  scale,
  scaleHeight,
  scaleWidth,
} from '../../theme';
import { CommonFontSize } from '../../theme/index';
import {GetHookProps,typeAlarmRegister} from './controller';
import { hookProps, store } from './controller';
import {
  onBtnAdvancePress,
  onBtnClearAllData,
  onClearFingerPress,
  onLowerThresholdDoneSubmit,
  onModalCancelPress,
  onModalOkEnterPasswordPress,
  onNumRetriesReadSubmit,
  onSavePress,
  onTextSubmitIp,
  onTextSubmitPort,
  onUpdateSeriVersionPress,
  onUpperThresholdDoneSubmit,
  onbtnAllowSigninByFingerPress,
} from './handleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ButtonList } from '../../component/buttonList/index';
import { ModalTextInput } from '../../component/modalTextInput';
import { CheckboxButton } from '../../component/checkbox/checkbox';

const inputAccessoryViewID = 'uniqueID';

export const SettingAndAlarmScreen = () => {
  GetHookProps();

  return (
    <>
      {hookProps.state.isBusy && (
        <View style={styles.containerLoader}>
          <Loader3 />
        </View>
      )}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <RNButton onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}
      <ModalTextInput
        label={'Nhập mật khẩu'}
        onOkPress={onModalOkEnterPasswordPress}
        onDissmiss={onModalCancelPress}
        secureTextEntry
        textAlign="center"
        show={hookProps.state.showModalEnterPass}
      />
      <ScrollView style={styles.conatiner}>
        <Button
          textStyle={styles.textUpdateMeterVersion}
          style={styles.btnUpdateSeriVersion}
          label="Cập nhật công tơ"
          onPress={onUpdateSeriVersionPress}
        />
        <Text style={styles.title}>Ngưỡng cảnh báo điện năng:</Text>
        <View style={styles.row}>
          {typeAlarmRegister.map(item => {
            return (
              <RadioButton
                key={item.value}
                label={item.title}
                value={item.value}
                checked={
                  store.state.appSetting.setting.typeAlarm === item.value
                    ? true
                    : false
                }
                onPress={() => {
                  store.setState(state => {
                    state.appSetting.setting.typeAlarm = item.value;
                    return { ...state };
                  });
                }}
              />
            );
          })}
        </View>
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textThreshold}>Nhỏ hơn:</Text>
            <TextInputInteractive
              placeholder=""
              keyboardType="numeric"
              inputAccessoryViewID={inputAccessoryViewID}
              value={
                store.state.appSetting.setting.typeAlarm === 'Value'
                  ? store.state.appSetting.setting.lowerThresholdValue
                  : store.state.appSetting.setting.lowerThresholdPercent
              }
              textInputStyle={styles.valueTextInput}
              onChangeText={text => {
                store.setState(state => {
                  if (state.appSetting.setting.typeAlarm === 'Value') {
                    state.appSetting.setting.lowerThresholdValue = text;
                  } else {
                    state.appSetting.setting.lowerThresholdPercent = text;
                  }
                  return { ...state };
                });
              }}
              onSubmitEditing={e => {
                onLowerThresholdDoneSubmit(e.nativeEvent.text);
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textThreshold}>Lớn hơn:</Text>
            <TextInputInteractive
              placeholder=""
              keyboardType="numeric"
              inputAccessoryViewID={inputAccessoryViewID}
              value={
                store.state.appSetting.setting.typeAlarm === 'Value'
                  ? store.state.appSetting.setting.upperThresholdValue
                  : store.state.appSetting.setting.upperThresholdPercent
              }
              onChangeText={text => {
                store.setState(state => {
                  if (state.appSetting.setting.typeAlarm === 'Value') {
                    state.appSetting.setting.upperThresholdValue = text;
                  } else {
                    state.appSetting.setting.upperThresholdPercent = text;
                  }
                  return { ...state };
                });
              }}
              onSubmitEditing={e => {
                onUpperThresholdDoneSubmit(e.nativeEvent.text);
              }}
              textInputStyle={styles.valueTextInput}
            />
          </View>
        </View>
        <Text style={styles.title}>Số lần đọc lại:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* <Text style={styles.textThreshold}>Nhỏ hơn:</Text> */}
          <TextInputInteractive
            placeholder=""
            keyboardType="numeric"
            inputAccessoryViewID={inputAccessoryViewID}
            value={store.state.appSetting.numRetriesRead}
            textInputStyle={styles.valueTextInput}
            onChangeText={text => {
              store.setState(state => {
                store.state.appSetting.numRetriesRead = text;
                return { ...state };
              });
            }}
            onSubmitEditing={e => {
              onNumRetriesReadSubmit(e.nativeEvent.text);
            }}
          />
        </View>
        <TouchableOpacity
          onPress={onBtnAdvancePress}
          style={styles.buttonAdvance}>
          <Text style={styles.normaleTitle}>Nâng cao</Text>
          <Ionicons
            name={!hookProps.state.showAdvanced ? 'chevron-down' : 'chevron-up'}
            color="black"
            size={20 * scale}
          />
        </TouchableOpacity>
        {hookProps.state.showAdvanced && (
          <>
            <Text style={styles.title}>Cài đặt server:</Text>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.textThreshold}>IP</Text>
                <TextInputInteractive
                  placeholder=""
                  // keyboardType="numeric"
                  inputAccessoryViewID={inputAccessoryViewID}
                  value={store.state.appSetting.server.host}
                  textInputStyle={styles.largeInput}
                  onChangeText={text => {
                    store.setState(state => {
                      store.state.appSetting.server.host = text.trim();
                      return { ...state };
                    });
                  }}
                  onSubmitEditing={e => {
                    onTextSubmitIp(e.nativeEvent.text);
                    //onLowerThresholdDoneSubmit(e.nativeEvent.text);
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.textThreshold}>Cổng:</Text>
                <TextInputInteractive
                  placeholder=""
                  keyboardType="numeric"
                  inputAccessoryViewID={inputAccessoryViewID}
                  value={store.state.appSetting.server.port}
                  onChangeText={text => {
                    store.setState(state => {
                      state.appSetting.server.port = text.trim();
                      return { ...state };
                    });
                  }}
                  onSubmitEditing={e => {
                    onTextSubmitPort(e.nativeEvent.text);
                    //onUpperThresholdDoneSubmit(e.nativeEvent.text);
                  }}
                  textInputStyle={styles.valueTextInput}
                />
              </View>
            </View>
            <Button
              textStyle={styles.textUpdateMeterVersion}
              style={styles.btnClearAllData}
              label="Xoá toàn bộ dữ liệu"
              onPress={onBtnClearAllData}
            />
          </>
        )}
        
        <CheckboxButton style={{marginVertical: 10}} label='Ghi sổ công tơ Hữu Hồng (Thử nghiệm)' checked={store.state.appSetting.hhu.enableReadNotGelex} onPress={()=>{
          store.setState(state => {
            state.appSetting.hhu.enableReadNotGelex = state.appSetting.hhu.enableReadNotGelex ? false : true;
            return {...state}
          });
        }} ></CheckboxButton>
        <CheckboxButton style={{marginVertical: 10}} label='Chỉ lấy chỉ số phần nguyên' checked={store.state.appSetting.hhu.isOnlyGetIntegers} onPress={()=>{
          store.setState(state => {
            state.appSetting.hhu.isOnlyGetIntegers = state.appSetting.hhu.isOnlyGetIntegers ? false : true;
            return {...state}
          });
        }} ></CheckboxButton>
        
        
      </ScrollView>
      <View style={styles.btnBottom}>
        <Button style={styles.button} label="Lưu" onPress={onSavePress} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  conatiner: {
    flex: 1,
    marginHorizontal: 10,
    paddingTop: 15,
  },
  containerLoader: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    zIndex: 1000000,
  },
  btnUpdateSeriVersion: {
    backgroundColor: '#97b4f8',
    maxWidth: 150 * scaleWidth,
    height: 25 * scaleHeight,
    alignSelf: 'flex-end',
    //justifyContent:borderWidth: 1,
  },
  btnClearAllData: {
    marginVertical: 15,
    backgroundColor: '#f3d20d',
    maxWidth: 150 * scaleWidth,
    height: 25 * scaleHeight,
    alignSelf: 'flex-end',
    //justifyContent:borderWidth: 1,
  },
  textUpdateMeterVersion: {
    color: 'black',
    fontWeight: 'normal',
    fontSize: normalize(14),
  },
  buttonAdvance: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    elevation: 1,
  },
  normaleTitle: {
    color: Colors.caption,
    fontSize: normalize(16),
    marginHorizontal: 5,
  },
  title: {
    fontSize: normalize(18),
    marginLeft: 5,
    color: Colors.text,
    marginVertical: 10,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
  },
  textThreshold: {
    marginHorizontal: 5,
    fontSize: normalize(14),
    height: CommonHeight,
    textAlignVertical: 'center',
    color: Colors.text,
    //color: 'black',
  },
  valueTextInput: {
    width: 80 * scale,
    borderColor: '#6e83e4',
    height: CommonHeight,
    fontSize: CommonFontSize,
    color: Colors.text,
  },
  btnBottom: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  button: {
    width: '50%',
    height: 50,
    alignSelf: 'center',
    maxWidth: 350,
  },
  largeInput: {
    width: 180 * scale,
    borderColor: '#6e83e4',
    height: CommonHeight,
    fontSize: CommonFontSize,
    color: Colors.text,
  },
});
