import React from 'react';
import { View, StyleSheet, Pressable , Text, FlatList} from 'react-native';
import { Colors, normalize } from '../../theme';
import { CheckboxButton } from '../checkbox/checkbox';
import { PropsBookDetailDLHNServerReturn, PropsSoapGetMaSoAndDataDLHNReturn } from '../../service/api/serverData';


type PropsRowHeader = {
    checked: boolean;
    title: string;
    onCheckedChange: () => void;
  };

export type PropDataBookDLHN = {
    id: string;
    checked: boolean;
    show: boolean;
    // data: PropsBookDetailDLHNServerReturn;
    data: PropsSoapGetMaSoAndDataDLHNReturn;
    listNV: string[];
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
  
  const Row = (item: PropDataBookDLHN) => {
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
            <Text style={styles.title}>{item.data.soGCS.MA_SOGCS}</Text>
            <View style={{ height: 5 }} />
            <View style={styles.rowTime} >
                <Text style={styles.subTitle}>
                Mã sổ: {item.data.soGCS.MA_SOGCS}
                </Text>
                <Text style={styles.subTitle}>
                Số điểm đo: <Text style={styles.subTitleCyan}>{item.data.danhSachBieu.length}</Text> 
                </Text>
            </View>
            
            <View style={styles.rowTime} >
                <Text style={styles.subTitle}>
                  Mã NV: {item.listNV.join(', ')}
                </Text>
                <Text style={styles.subTitle}>
                  kỳ: {item.data.soGCS.KY} /{item.data.soGCS.THANG}/{item.data.soGCS.NAM}
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
    rowData: PropDataBookDLHN[];
  }

  export function BookServer(props : PropsBookServer) {

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
      },
      subTitleCaption: {
        fontSize: normalize(16),
        color: Colors.caption,
      },
  });