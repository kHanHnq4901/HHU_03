import { RouteProp, useRoute } from '@react-navigation/native';
import throttle from 'lodash.throttle';
import React, { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import Entypo from 'react-native-vector-icons/Entypo';
import { Button } from '../../component/button/button';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import Loader1 from '../../component/loader1';
import { ModalWriteRegister } from '../../component/modal/modalWriteRegister';
import { StackWriteDataByColumnCodeList } from '../../navigation/model/model';
import { GetColorDisplay, TYPE_READ_RF, VersionMeter } from '../../service/hhu/defineEM';
import { Colors, normalize, scaleHeight, scaleWidth } from '../../theme';
import { sizeScreen } from '../../theme/index';
import { hookProps as selectColumnCodeHook } from '../selectColumnCode/controller';
import {
  SubRow1Memo,
  SubRow2Memo,
  SubRow3Memo,
  styleItemRow,
} from '../writeDataByBookCode';
import {
  GetHookProps,
  PropsDatatable,
  hookProps,
  isCloseToBottom,
  onDeInit,
  onInit,
  onScrollToEnd,
} from './controller';
import {
  onBtnReadPress,
  onChangeTextSearch,
  onCheckBoxTypeReadChange,
  onItemPress,
  onPencilPress,
  onSelectAllPress,
  onSelectedItemDropdown,
  onStopReadPress,
  onTakePicturelPress,
} from './handleButton';
import { store } from '../../component/drawer/drawerContent/controller';
import { toLocaleDateString } from '../../util';

const IconPencilMemo = React.memo((props: { item: PropsDatatable }) => {
  function _PencilPress() {
    //console.log('pencil press');
    onPencilPress({
      data: props.item,
    });
  }
  return (
    <TouchableOpacity style={styleItemRow.pencil} onPress={_PencilPress}>
      <Entypo name="pencil" size={35} color={Colors.primary} />
    </TouchableOpacity>
  );
});

const IconTakePictureMemo = React.memo((props: { item: PropsDatatable }) => {
  
  function _TakePress() {
    console.log('take press:');
    onTakePicturelPress({
      data: props.item,
    });
  }
  const hasImage = props.item.data.hasImage === '1' ? true : false;
  return (
    <TouchableOpacity style={styleItemRow.camera} onPress={_TakePress}>
      <Entypo name={hasImage ? 'image' : "camera"} size={hasImage ? 25 :30} color={hasImage ?Colors.colorIcon : Colors.primary} />
    </TouchableOpacity>
  );
}, (prev, next ) => prev.item.data.hasImage === next.item.data.hasImage);


//ListRenderItemInfo<PropsDatatable>
function ItemStock(item: PropsDatatable) {
  //const item = props.item;
  if (item.show !== true) {
    return null;
  }
  // console.log('ren:', item.stt);
  let backgroundColor = GetColorDisplay(item.checked, item.data.LoaiDoc as TYPE_READ_RF);

  function _onItemPress() {
    onItemPress(item);
  }

  const versionMeter =
    item.versionMeter === VersionMeter.IEC
      ? 'IEC'
      : item.versionMeter === VersionMeter.DLMS_MANY_CHANEL
      ? 'DLMS v1'
      : 'DLMS v2';

  return (
    <TouchableOpacity
      onPress={_onItemPress}
      style={{ ...styleItemRow.container, backgroundColor: backgroundColor }}>
      <IconPencilMemo item={item} />
      {
        true && <IconTakePictureMemo item={item}></IconTakePictureMemo>
      }
      <View style={styleItemRow.row}>
        {/* <Checkbox status={item.checked ? 'checked' : 'unchecked'} /> */}
        <CheckboxButton checked={item.checked} />
        
        <SubRow2Memo
          TT={item.stt}
          SERY_CTO={item.data.SERY_CTO}
          LOAI_BCS={item.data.LOAI_BCS}
          labelMeter={item.labelMeter + ' - ' + versionMeter}
        />
      </View>
      <SubRow1Memo
        MA_QUYEN={item.data.MA_QUYEN}
        MA_COT={item.data.MA_COT}
        TEN_KHANG={item.data.TEN_KHANG}
        MA_KHANG={item.data.MA_KHANG}
        DIA_CHI={item.data.DIA_CHI}
      />
      <SubRow3Memo
        CS_MOI={item.data.CS_MOI}
        SL_MOI={item.data.SL_MOI}
        CS_CU={item.data.CS_CU}
        SL_CU={item.data.SL_CU}
        isManyPrice={item.isManyPrice}
        PMAX={item.data.PMAX}
        NGAY_PMAX={item.data.NGAY_PMAX}
        loginMode={store.state.appSetting.loginMode}
        isSent={item.data.isSent === "1"}
        hasImage={item.data.hasImage === '1'}
      />
    </TouchableOpacity>
  );
}

function areEqual(prev: PropsDatatable, next: PropsDatatable) {
  
  if (
    prev.checked !== next.checked ||
    prev.data.CS_MOI !== next.data.CS_MOI ||
    prev.data.LoaiDoc !== next.data.LoaiDoc ||
    prev.data.RF !== next.data.RF ||
    prev.data.hasImage !== next.data.hasImage 
  ) {
    return false;
  }
  return true;
}

const ItemStockMemoried = React.memo(ItemStock, areEqual);

export const WriteColumnCodeScreen = () => {
  GetHookProps();

  const route =
    useRoute<RouteProp<StackWriteDataByColumnCodeList, 'WriteColumn'>>();
  const paramsRoute = route.params;

  //console.log('paramsRoute:', paramsRoute);

  const ref = useRef<SelectDropdown | null>(null);

  React.useEffect(() => {
    onInit(paramsRoute, ref);

    return () => {
      onDeInit();
    };
  }, []);
  //console.log('variable:', JSON.stringify(variable.modalAlert));

  return (
    <View style={styles.container}>
      <ModalWriteRegister
        title={store?.state.modal.modalAlert.title ?? ''}
        info={store?.state.modal.modalAlert.content ?? ''}
        onDismiss={store?.state.modal.modalAlert.onDissmiss}
        onOKPress={store?.state.modal.modalAlert.onOKPress}
      />
      <View style={{ backgroundColor: 'white' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.label}>Chọn mã cột</Text>
          <Text style={styles.percentSucceed}>
            Thành công: {hookProps.state.totalSucceed}/{' '}
            {hookProps.state.totalBCS}
          </Text>
          {selectColumnCodeHook.state.is0h && (
            <Text style={styles.label}>
              Ghi 0h{': '}
              {toLocaleDateString(selectColumnCodeHook.state.dateLatch)}
            </Text>
          )}
        </View>

        <View style={styles.selectColumn}>
          {/* <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            {hookProps.state.arrColumnColumnCode.map(column => (
              <ItemColumnMemorized
                key={column}
                column={column}
                selectedColumn={hookProps.state.selectedColumn as string}
              />
            ))}
          </ScrollView> */}
          <View style={styles.containerSearch}>
            <View style={styles.dropdown}>
              <SelectDropdown
                ref={ref}
                buttonStyle={styles.dropdown}
                defaultButtonText="Tất cả"
                data={hookProps.state.arrColumnColumnCode}
                buttonTextStyle={{
                  color: Colors.primary,
                  fontSize: normalize(16),
                }}
                dropdownStyle={{ maxHeight: '100%' }}
                rowTextStyle={{ fontSize: normalize(18) }}
                //rowTextStyle={{ color: Colors.primary }}
                onSelect={onSelectedItemDropdown}
                buttonTextAfterSelection={selectedItem => {
                  // text represented after item is selected
                  // if data array is an array of objects then return selectedItem.property to render after item is selected
                  return selectedItem;
                }}
                rowTextForSelection={item => {
                  // text represented for each item in dropdown
                  // if data array is an array of objects then return item.property to represent item in dropdown
                  return item;
                }}
              />
            </View>
            <TextInput
              style={styles.searchText}
              placeholder="Tìm kiếm"
              placeholderTextColor={Colors.caption}
              onChangeText={throttle(text => onChangeTextSearch(text), 300)}
            />
            <Button
              style={styles.btn}
              label={
                hookProps.state.isReading
                  ? hookProps.state.requestStop
                    ? 'Đang dừng'
                    : 'Dừng'
                  : 'Đọc'
              }
              onPress={() => {
                //console.log('3');
                if (hookProps.state.isReading !== true) {
                  //console.log('4');
                  onBtnReadPress();
                  //console.log('5');
                } else {
                  //console.log('1');
                  if (hookProps.state.requestStop !== true) {
                    //console.log('2');
                    onStopReadPress();
                  }
                }
              }}
            />
          </View>
          <View style={styles.containerTypeRead}>
            {hookProps.state.arrCheckBoxRead.map(item => (
              <CheckboxButton
                checked={item.checked}
                label={item.label}
                key={item.label}
                onPress={() => {
                  onCheckBoxTypeReadChange(item.label);
                }}
              />
            ))}
          </View>

          <Text style={styles.status}>{hookProps.state.status}</Text>
          {hookProps.state.selectedColumn !== null &&
            hookProps.state.selectedColumn !== 'Tất cả' && (
              <CheckboxButton
                checked={hookProps.state.selectAll}
                label="Chọn hết"
                onPress={onSelectAllPress}
              />
            )}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {hookProps.state.isReading && (
          <View style={styles.bigLoading}>
            {/* <Pie progress={0.4} size={sizeChartWaiting} indeterminate={true} /> */}
            {/* <BubblesLoader size={60} /> */}
            <Loader1 />
          </View>
        )}
        <ScrollView
          // ref={refScroll}
          style={{zIndex: 0}}
          onScroll={({ nativeEvent }) => {
            if (isCloseToBottom(nativeEvent)) {
              //enableSomeButton();
              //console.log('to end');
              onScrollToEnd();
            }
          }}
          scrollEventThrottle={300}>
          {hookProps.state.dataTable.render.map(item => {
            if (item.show) {
              return <ItemStockMemoried key={item.id} {...item} />;
            } else {
              return null;
            }
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 3,

    backgroundColor: Colors.backgroundColor,
  },
  status: {
    fontSize: normalize(18),
    color: Colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    //marginVertical: 5,
    paddingHorizontal: 10,
  },
  selectColumn: {
    marginTop: 15,
  },
  itemColumn: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: Colors.border,
    marginHorizontal: 10,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80 * scaleWidth,
  },
  label: {
    fontSize: normalize(15),
    color: Colors.caption,
    paddingHorizontal: 10,
  },
  titleColumn: {
    fontSize: normalize(18),
    //color: Colors.primary,
    color: 'black',
    fontWeight: 'bold',
  },
  containerSearch: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    //marginTop: 10,
    zIndex: 200,
  },
  searchText: {
    borderWidth: 1,
    borderColor: Colors.border,
    flexGrow: 1,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 35 * scaleHeight,
    fontSize: normalize(15),
  },
  btn: {
    marginLeft: 10,
    minWidth: 100,
    width: '15%',
    height: 40 * scaleHeight,
    zIndex: 200,

    //backgroundColor: Colors.pink,
  },
  dropdown: {
    width: sizeScreen.width * 0.2,
    borderRadius: 25,
    backgroundColor: '#dcf0f8',
    height: 35 * scaleHeight,
  },
  containerTypeRead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    //marginBottom: 10,
  },
  percentSucceed: {
    fontSize: normalize(16),
    textAlignVertical: 'center',
    position: 'absolute',
    textAlign: 'center',
    width: 150 * scaleWidth,
    left: sizeScreen.width / 2 - (150 * scaleWidth) / 2,
    color: Colors.blurPrmiary,
  },
  bigLoading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    top: 0,
    opacity: 1,
    zIndex: 10000000,
    backgroundColor: 'transparent',
  },
});
