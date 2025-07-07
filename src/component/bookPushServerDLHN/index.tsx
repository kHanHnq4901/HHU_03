import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, normalize } from '../../theme';
import { CheckboxButton } from '../checkbox/checkbox';


type PropsRowHeader = {
    checked: boolean;
    title: string;
    onCheckedChange: () => void;
  };

export type PropPushDataBookDLHN = {
    id: string;
    checked: boolean;
    show: boolean;
    // data: PropsBookDetailDLHNServerReturn;
    data: {
      maSo: string;
      maDonViQLY: string;
      ky: string;
      thang: string;
      nam: string;
      numSucceedRF: number;
      numWriteByHand: number;
      numFailed: number;
      numAbnormal: number;
      numNotRead: number;
      total: number;
    };
    onCheckedChange: () => void;
  };
const RowHeader = (props: PropsRowHeader) => {
    return (
      <View style={styles.containerRowTable}>
        <Pressable
          onPress={props.onCheckedChange}
          style={styles.checkTabel}>
          <CheckboxButton
            uncheckedColor={Colors.blurPrmiary}
            checked={props.checked}
            onPress={props.onCheckedChange}
          />
          
        </Pressable>
        <View style={styles.contentTable}>
          <Text style={styles.title}>{props.title}</Text>
        </View>
      </View>
    );
  };
  
  const Row = (item: PropPushDataBookDLHN) => {
    return (
      item.show && (
        <Pressable
          onPress={item.onCheckedChange}
          style={styles.containerRowTable}>
          <View style={styles.checkTabel}>
           
            <CheckboxButton
              uncheckedColor={Colors.blurPrmiary}
              checked={item.checked}
              onPress={item.onCheckedChange}
            />
          </View>
          
          <View style={styles.contentTable}>
            <Text style={styles.title}>{item.data.maSo}</Text>
            <View style={{ height: 5 }} />
            <View style={styles.rowTime} >
                <Text style={styles.subTitle}>
                Tổng điểm  đo: {item.data.total}
                </Text>
                <Text style={styles.subTitle}>
                Thành công: <Text style={styles.subTitleCyan}>{item.data.numSucceedRF}</Text> 
                </Text>
                <Text style={styles.subTitle}>
                Ghi tay: <Text style={styles.subTitleCyan}>{item.data.numWriteByHand}</Text> 
                </Text>
                <Text style={styles.subTitle}>
                Bất thường: <Text style={styles.subTitleCyan}>{item.data.numAbnormal}</Text> 
                </Text>
                <Text style={styles.subTitle}>
                Thất bại: <Text style={styles.subTitleCyan}>{item.data.numFailed}</Text> 
                </Text>
                <Text style={styles.subTitle}>
                Chưa đọc: <Text style={styles.subTitleCyan}>{item.data.numNotRead}</Text> 
                </Text>
            </View>
            
            <View style={styles.rowTime} >
                <View></View>
                <Text style={styles.subTitle}>
                  kỳ: {item.data.ky} /{item.data.thang}/{item.data.nam}
                </Text>
                {/* <Text style={styles.subTitle}>
                Ngày ghi: {item.data.soGCS.NAM}
                </Text> */}
            </View>
          </View>
        </Pressable>
      )
    );
  };


  type PropsBookServer ={
    rowHeader: PropsRowHeader;
    rowData: PropPushDataBookDLHN[];
  }

  export function BookPushServer(props : PropsBookServer) {

    return <View style={styles.container} >
        <RowHeader {...props.rowHeader} ></RowHeader>
        <FlatList
            data={props.rowData}
            renderItem={({item, index}) => <Row {...item} ></Row>}
        ></FlatList>
    </View>
  }

  const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        minWidth: 60,
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
      subTitle: {
        fontSize: normalize(16),
        color: Colors.blurPrmiary,
      },
      subTitleCyan: {
        fontSize: normalize(16),
        color: Colors.purple,
        fontWeight:'bold',
      },
      rowTime: {
        flexDirection:'row',
        justifyContent:'space-between',
        width:'100%',
        paddingHorizontal: 5,
        marginBottom: 5,
        flexWrap:'wrap',
      },
      subTitleCaption: {
        fontSize: normalize(16),
        color: Colors.caption,
      },
  });