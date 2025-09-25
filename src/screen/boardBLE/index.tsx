import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import throttle from 'lodash.throttle';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { Button } from '../../component/button/button';
import { DrawerParamsList } from '../../navigation/model/model';
import Theme, {
  Colors,
  CommonFontSize,
  normalize,
  sizeScreen,
} from '../../theme';
import * as controller from './controller';
import { GetHookProps, hookProps, store, variable } from './controller';
import * as handleBtn from './handleButton';


import { ModalGetText } from '../../component/modal/modalGetText';

const sizeChartPie = sizeScreen.width * 0.42;

export const BoardBLEScreen = () => {
  GetHookProps();

  const route = useRoute<RouteProp<DrawerParamsList, 'BoardBLE'>>();

  //const navigation = useNavigation();

  useEffect(() => {
    controller.onInit();
    return controller.onDeInit;
  }, []);



  const version =
    controller.store?.state.hhu.version?.length === 0
      ? ''
      : 'HHU: ' + controller.store?.state.hhu.version;

  return (
    <View style={styles.container}>
      <ModalGetText
        title="Đổi tên"
        visible={hookProps.state.showModalSetName}
        onOKPress={variable.onOkChangeName}
        onDismiss={variable.onDismiss}
      />
      <Text style={styles.version}>{version}</Text>
      <Text style={styles.status}>{hookProps.state.status}</Text>
      <View style={styles.loading}>
        {hookProps.state.isBusy }
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.btnArea}>
          <Button
            label="Đọc version"
            style={styles.btn}
            textStyle={styles.textbtn}
            //style={{ ...styles.btn, backgroundColor: Colors.secondary }}
            onPress={throttle(handleBtn.onReadVersionBtnPress, 2000)}
          />
          <Button
            label="Kiểm tra update"
            style={styles.btn}
            textStyle={styles.textbtn}
            //style={{ ...styles.btn, backgroundColor: Colors.secondary }}
            onPress={throttle(handleBtn.onCheckUpdateBtnPress, 2000)}
          />
          <Button
            label={
              hookProps.state.isUpdatingFirmware
                ? 'Đang cập nhật ...'
                : 'Cập nhật phần mềm'
            }
            style={styles.btn}
            textStyle={styles.textbtn}
            //style={{ ...styles.btn, backgroundColor: Colors.secondary }}
            onPress={throttle(handleBtn.ondUpdateFirmwareBtnPress, 2000)}
          />
         <Button
          label="Đổi tên thiết bị"
          style={styles.btn}
          textStyle={styles.textbtn}
          onPress={() => {
            hookProps.setState(state => {
              state.showModalSetName = true;
              return { ...state };
            });
          }}
        />
        </View>
        <View
          style={{
            flex: 1,
            minHeight: sizeChartPie,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}>
          {hookProps.state.showProgress && (
            <Progress.Circle
              size={sizeChartPie}
              indeterminate={false}
              progress={hookProps.state.progressUpdate}
              borderWidth={2}
              formatText={pro => {
                //console.log('pro:', pro);
                return (pro * 100).toFixed(1) + '%';
              }}
              showsText={true}
              thickness={5}
              //style={{ margin: 5, padding: 5 }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.backgroundColor,
  },
  title: {
    fontSize: 24,
    margin: 5,
    alignSelf: 'center',
  },
  status: {
    color: Colors.primary,
    fontSize: CommonFontSize,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginVertical: 5,
    marginHorizontal: 15,
  },
  btnArea: {
    //flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    width: '90%',
    height: 50,
    maxWidth: 350,
  },
  textbtn: {
    //color: 'black',
  },

  loading: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    fontSize: normalize(20),
    color: Colors.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginVertical: 10,
  },
});
