import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import IconAnt from 'react-native-vector-icons/AntDesign';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Caption } from 'react-native-paper';
import { StackRootParamsList } from '../../navigation/model/model';
import { Colors, normalize } from '../../theme';
import {
  GetHookProps,
  PropsItemBle,
  hookProps,
  onDeInit,
  onInit,
  store
} from './controller';
import { connectHandle, disConnect, onScanPress } from './handleButton';

const TAG = 'BleScreen:';

const BleItem = (props: PropsItemBle) => {
  return (
    <TouchableOpacity
      onPress={() => {
        connectHandle(props.id, props.name);
      }}
      style={styles.containerItem}
      onLongPress={() => {
        disConnect(props.id);
      }}>
      <View style={styles.row}>
        <Text style={{ ...styles.titleItem, maxWidth: '90%' }}>
          {props.name}
        </Text>
        <View style={styles.rowNormal}>
          <IconFontAwesome
            name="bluetooth"
            size={25}
            color={
              props.id === store?.state.hhu.idConnected ? '#5fe321' : '#ad0c0c'
            }
          />
        </View>
      </View>
      <View style={styles.row}>
        <Caption style={styles.caption}>{props.id}</Caption>
        {props.rssi && (
          <View style={styles.containerRssi}>
            <Text style={styles.rssi}>
              {props.rssi}
              {' dbm'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

//const BleItemMemorize = React.memo(BleItem, (prev, next) => next.id !== );

export const SetUpBleScreen = () => {
  GetHookProps();

  const navigation = useNavigation<StackNavigationProp<StackRootParamsList>>();

  React.useEffect(() => {
    onInit(navigation);
    return () => {
      onDeInit();
    };
  }, []);

  //const refScroll = useRef<any>({});

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
    <View style={{ flex: 1, paddingHorizontal: 10, marginTop: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          marginVertical: 5,
          // backgroundColor: 'pink',
          // marginTop: 70,

          paddingHorizontal: 8,
        }}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={onScanPress}
          style={{
            flexDirection: 'row',
            backgroundColor: '#ede8e9',
            padding: 10,
            borderRadius: 15,
          }}>
          <Text style={{ fontSize: 20, marginRight: 10, color: Colors.text }}>
            {hookProps.state.ble.isScan ? 'Đang tìm kiếm ...' : 'Tìm kiếm'}
          </Text>
          <IconAnt name="search1" size={35} color="#f70f3c" />
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{hookProps.state.status}</Text>

     
        {store.state.hhu.connect === 'CONNECTED' && (
          <>
            <Text style={{ ...styles.title, marginBottom: 10 }}>
              Thiết bị đang kết nối:
            </Text>
          
            <BleItem
              id={store.state.hhu.idConnected as string}
              name={store.state.hhu.name as string}
              rssi={
                store.state.hhu.rssi === 0 ? undefined : store.state.hhu.rssi
              }
            />
      
          </>
        )}
         
        {
          Platform.OS === 'android' && (
            <>
        <Text style={{ ...styles.title, marginBottom: 10, marginTop: 25 }}>
          Thiết bị của bạn:
        </Text>
        {hookProps.state.ble.listBondedDevice.map((item, index) => {
          return <BleItem key={item.id} id={item.id} name={item.name} />;
        })}
        </>
          )
        }
         
        <Text style={{ ...styles.title, marginBottom: 10 }}>
          Thiết bị khả dụng:
        </Text>
    
            {hookProps.state.ble.listNewDevice.map((item, index) => {
              return (
                <BleItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  rssi={item.rssi}
                />
                
              );
            })}
      
      
   
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    color: Colors.text,
     fontWeight: 'bold',
  },
  titleItem: {
    fontSize: 20,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  containerItem: {
    paddingVertical: 5,
    marginVertical: 5,
    backgroundColor: '#ede8e9',
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 1,
  },
  caption: {
    color: 'green',
  },
  status: {
    fontSize: normalize(18),
    color: Colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginVertical: 5,
  },
  rowNormal: {
    flexDirection: 'row',
  },
  containerRssi: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 20,
    // backgroundColor: Colors.secondary,
  },
  rssi: {
    padding: 5,
    fontSize: normalize(14),
    color: Colors.text,
  },
});
