import { useNavigation } from '@react-navigation/native';
import React, { useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DetailDB } from '../../component/detailDB';
import Theme, { Colors, normalize } from '../../theme';
import {
  colorsChart,
  dummyDataTable,
  GetHook,
  hookProps,
  labelsStock,
  onDeInit,
  onInit,
} from './controller';

const deviceWidth = Dimensions.get('window').width;

const ItemLabel = (props: {
  label: string;
  quantity: number;
  color: string;
}) => {
  return (
    <View style={styles.containerItemLabel}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 15,
          backgroundColor: props.color,
          marginRight: 10,
        }}
      />
      <Text style={{ color: 'black', fontSize: normalize(20) }}>
        {props.label + ': ' + props.quantity}
      </Text>
    </View>
  );
};

const heightChart = deviceWidth * 1;
const innerRadius = (deviceWidth / 2) * 0.3;
const connerRadius = (deviceWidth / 2) * 0.3 * 0.9;
const radius = (deviceWidth / 2) * 0.9;
const labelRadius = ((radius + innerRadius) / 2) * 0.8;

export const OverViewScreen = () => {
  GetHook();

  const navigation = useNavigation();

  React.useEffect(() => {
    onInit(navigation);
    return () => {
      onDeInit(navigation);
    };
  }, []);
  let total = 0;
  let is100percent = false;

  for (let itm of hookProps.state.graphicData) {
    total += itm.y;
  }
  for (let itm of hookProps.state.graphicData) {
    if (total === itm.y) {
      is100percent = true;
    }
  }

  // const ref = useRef<VictoryPie>(null);

  // ref.current?.render();

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.container}>
          {/* <Text style={styles.title}>
            {total === 0 ? 'Chưa có dữ liệu' : 'Tỉ lệ lấy dữ liệu'}
          </Text> */}
          <View style={styles.chart}>
          
          </View>
        </View>
        {/* <View
          style={{0
            width: '100%',
            height: 80,
          }}
        /> */}
        <View style={styles.detailTitleChart}>
          {hookProps.state.infoQuantityArr.map((item, index) => {
            let quantity = 0;
            // if (index === labelsStock.length - 1) {
            //   for (let itm of hookProps.state.graphicData) {
            //     quantity += itm.y;
            //   }
            // } else {
              
            //   quantity = hookProps.state.graphicData[index].y;
            //   // if(hookProps.state.graphicData[index])
            //   // {
                
            //   // }else{
            //   //   quantity = 1;
            //   //   console.log('item:', item);
            //   // console.log('index:', index);
                
            //   // }

            // }

            quantity = item.quantity;

            return (
              <ItemLabel
                color={item.color}
                label={item.label}
                key={index.toString()}
                quantity={quantity}
              />
            );
          })}
        </View>
        <Text style={styles.caption} >Truy cập màn hình "Xem chỉ số" để biết thêm chi tiết</Text>
        <DetailDB data={hookProps.state.detailDB} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  caption: {
    textAlign: 'center',
    fontSize: normalize(16),
    color: Colors.caption,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.backgroundColor,
  },
  title: {
    fontSize: normalize(24),
    margin: 10,
    alignSelf: 'center',
  },
  chart: {
    //backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  detailTitleChart: {
    justifyContent: 'center',
    //alignItems: 'center',
    flex: 1,
    flexGrow: 1,
    paddingLeft: deviceWidth / 2 - 50,
    marginBottom: 20,
    marginTop: 25,
    //backgroundColor: 'pink',
  },
  containerItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    marginHorizontal: 15,
  },
});
