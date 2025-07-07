import React from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Button as RNButton,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import TextInputInteractive from 'react-native-text-input-interactive';
import { Text } from '../../component/Text';
import { Button } from '../../component/button/button';
import { Colors, CommonHeight, normalize, scale } from '../../theme';
import { CommonFontSize } from '../../theme/index';

import { UpdateHook, hook, listSelectServer, store } from './controller';
import { getDefaultIPPort, onSavePress } from './handle';
import { RadioButton } from '../../component/radioButton/radioButton';
import { CheckboxButton } from '../../component/checkbox/checkbox';

const inputAccessoryViewID = 'uniqueID';

export const SettingIPPortScreen = () => {
  UpdateHook();
  const isCMIS = hook.state.appSetting.isCMISDLHN === true;
  const isDLHN = hook.state.selectedSerVer === 'ĐL Hà Nội';
  return (

    <View style={styles.contain}>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <RNButton onPress={() => Keyboard.dismiss()} title="OK" />
        </InputAccessoryView>
      )}

      <ScrollView style={styles.container}>
        <Text style={styles.title}>Chọn server:</Text>
        <View style={styles.listSelectServer}>
          {listSelectServer.map(item => {
            return (
              <RadioButton
                checked={hook.state.selectedSerVer === item}
                key={item}
                label={item}
                value={item}
                onPress={() => {
                  hook.setState(state => {
                    state.selectedSerVer = item;
                    if(item === 'ĐL Hà Nội')
                    {
                      if(hook.state.appSetting.isCMISDLHN)
                      {
                        //store.state.appSetting.isCMISDLHN = true;
                        item = 'CMIS';
                      }
                      state.appSetting.loginMode = 'ĐL Hà Nội';
                    }else if(item === 'NPC')
                    {
                      state.appSetting.loginMode = 'NPC';
                    }                
                    const defaultHostPort = getDefaultIPPort(item);

                    console.log('defaultHostPort:', defaultHostPort);
                    
                    state.appSetting.server.host = defaultHostPort.host;
                    state.appSetting.server.port = defaultHostPort.port;
                    

                    return { ...state };
                  });
                }}
              />
            );
          })}
        </View>
        { hook.state.selectedSerVer === 'ĐL Hà Nội' && <View style={{marginLeft: 20}} >
          <CheckboxButton checked={isCMIS} label={'CMIS'}  onPress={() => {
            hook.setState(state => {
              state.appSetting.isCMISDLHN = !state.appSetting.isCMISDLHN;
              const defaultHostPort = getDefaultIPPort(state.appSetting.isCMISDLHN ? 'CMIS' : 'ĐL Hà Nội');
                    hook.state.appSetting.server.host = defaultHostPort.host;
                    hook.state.appSetting.server.port = defaultHostPort.port;
              return {...state};
            });
          }} ></CheckboxButton>
        </View>}
        
        <View style={styles.containerIPPort}>
          {
            isDLHN && isCMIS && 
                <View style={styles.containerItemIPPort}>
                  <Text style={styles.title}>Link Quyển:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* <Text style={styles.textThreshold}>Nhỏ hơn:</Text> */}
                    <TextInputInteractive
                      placeholder=""
                      //keyboardType="numeric"
                      placeholderTextColor={Colors.caption}
                      value={store.state.appSetting.server.hostLayQuyenCMIS}
                      textInputStyle={styles.textIP}
                      onChangeText={text => {
                        store.setState(state => {
                          store.state.appSetting.server.hostLayQuyenCMIS = text;
                          return { ...state };
                        });
                      }}
                      
                    />
                  </View>
              </View>
          }
          <View style={styles.containerItemIPPort}>
            <Text style={styles.title}>{( isDLHN && isCMIS ) ? 'Link CMIS' :  'IP dữ liệu'}:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* <Text style={styles.textThreshold}>Nhỏ hơn:</Text> */}
              <TextInputInteractive
                placeholder=""
                //keyboardType="numeric"
                placeholderTextColor={Colors.caption}
                value={hook.state.appSetting.server.host}
                textInputStyle={styles.textIP}
                onChangeText={text => {
                  hook.setState(state => {
                    state.appSetting.server.host = text;
                    return { ...state };
                  });
                }}
                // onSubmitEditing={e => {
                //   onNumRetriesReadSubmit(e.nativeEvent.text);
                // }}
              />
            </View>
          </View>
          {/* <View style={styles.containerItemIPPort}>
            <Text style={styles.title}>Port dữ liệu:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              
              <TextInputInteractive
                placeholder=""
                keyboardType="numeric"
                inputAccessoryViewID={inputAccessoryViewID}
                placeholderTextColor={Colors.caption}
                value={store.state.appSetting.server.port}
                textInputStyle={styles.valueTextInput}
                onChangeText={text => {
                  store.setState(state => {
                    store.state.appSetting.server.port = text;
                    return { ...state };
                  });
                }}
                // onSubmitEditing={e => {
                //   onNumRetriesReadSubmit(e.nativeEvent.text);
                // }}
              />
            </View>
          </View> */}
        </View>
        <View style={styles.containerIPPort}>
          {/* <View style={styles.containerItemIPPort}>
            <Text style={styles.title}>IP HU:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             
              <TextInputInteractive
                placeholder=""
                // keyboardType="numeric"
                value={store.state.appSetting.hhu.host}
                textInputStyle={styles.textIP}
                onChangeText={text => {
                  store.setState(state => {
                    store.state.appSetting.hhu.host = text.trim();
                    return { ...state };
                  });
                }}
                
              />
            </View>
          </View> */}
          {/* <View style={styles.containerItemIPPort}>
            <Text style={styles.title}>Port HU:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             
              <TextInputInteractive
                placeholder=""
                keyboardType="numeric"
                inputAccessoryViewID={inputAccessoryViewID}
                value={store.state.appSetting.hhu.port}
                textInputStyle={styles.valueTextInput}
                onChangeText={text => {
                  store.setState(state => {
                    store.state.appSetting.hhu.port = text.trim();
                    return { ...state };
                  });
                }}
                
              />
            </View>
          </View> */}
        </View>
      </ScrollView>
      <View style={styles.btnBottom}>
        <Button style={styles.button} label="Lưu" onPress={onSavePress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listSelectServer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  contain: {
    backgroundColor: Colors.backgroundColor,
    flex: 1,
  },
  chanelRF: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginVertical: 5,
    marginBottom: 50,
  },
  container: {
    flex: 1,
    marginHorizontal: 10,
    paddingTop: 15,
  },
  title: {
    fontSize: normalize(18),
    marginLeft: 5,
    color: Colors.caption,
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
  buttonSmall: {
    width: '30%',
    height: 45,
    alignSelf: 'center',
    maxWidth: 100,
    backgroundColor: '#0cf814',
  },
  containerItemIPPort: {
    marginRight: 20,
  },
  containerIPPort: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingLeft: 15,
  },
  textIP: {
    // width: 200 * scale,
    borderColor: '#6e83e4',
    height: CommonHeight,
    fontSize: CommonFontSize,
    color: Colors.text,
  },
});
