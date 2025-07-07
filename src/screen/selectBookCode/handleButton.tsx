import { Alert } from 'react-native';
import { StackWriteBookCodeNavigationProp } from '../../navigation/model/model';
import { TYPE_READ_RF } from '../../service/hhu/defineEM';
import { hookProps, PropsTabel } from './controller';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export const onDropdownSelected = (stationName: string) => {
  let meterStationSet = new Set<string>();
  let bookCodeSet = new Set<string>();
  let listMaNVSet = new Set<string>();
  let totalBCSStation = 0;
  let totalCapacityStation = 0;
  for (let item of hookProps.state.dataDB) {
    if (item.MA_TRAM === stationName) {
      meterStationSet.add(item.SERY_CTO);
      bookCodeSet.add(item.MA_QUYEN);
      listMaNVSet.add(item.MA_NVGCS);
      totalBCSStation += 1;
      if (Number(item.CS_MOI) !== 0) {
        totalCapacityStation += Number(item.CS_MOI) - Number(item.CS_CU);
      }
      
    }
  }
  let dataTable: PropsTabel[] = [];
  bookCodeSet.forEach(bookCode => {
    //console.log('bookCode:', bookCode);
    let totalMeterReadSucceed = 0;
    let totalCapacityBook = 0;
    let totalMeter = 0;
    for (let item of hookProps.state.dataDB) {
      if (item.MA_QUYEN === bookCode) {
        totalMeter++;
        if (Number(item.CS_MOI) !== 0) {
          totalMeterReadSucceed++;
          totalCapacityBook += Number(item.CS_MOI) - Number(item.CS_CU);
        }
      }
    }
    dataTable.push({
      id: bookCode,
      bookCode: bookCode,
      succeedMeter: totalMeterReadSucceed.toString(),
      capacityStation: totalCapacityBook.toFixed(0),
      totalMeter: totalMeter.toString(),
      checked: false,
      show: true,
      listMaNV: Array.from(listMaNVSet),
    });
  });
  hookProps.setState(state => {
    state.dataTabel = dataTable;
    state.totalMeterStation = meterStationSet.size.toString();
    state.totalBCSStation = totalBCSStation.toString();
    state.capacityStation = totalCapacityStation.toFixed(0);
    state.selectedStationCode = stationName;

    state.searchTotal =  dataTable.length;
    state.searchFound =  dataTable.length;

    return { ...state };
  });
};

export const onChangeTextSearch = (value: string) => {
  //console.log('a');
  const searchText = value.toLowerCase();

  let total = 0;
  let found = 0;

  hookProps.setState(state => {
    state.dataTabel = state.dataTabel.map(item => {
      total ++;
      if (item.bookCode.toLowerCase().includes(searchText)) {
        
        item.show = true;
      } else {
        item.show = false;
      }
      if(!item.show)
      {
        for(let maNV of item.listMaNV)
        {
          if (maNV.toLowerCase().includes(searchText)) {
            item.show = true;
            break;
          } else {
            item.show = false;
          }
        }
      }

      if(item.show)
      {
        found ++;
      }
      return { ...item };
    });

    state.searchTotal = total;
    state.searchFound = found;
    return { ...state };
  });
};

export const onOKPress = (navigation: StackWriteBookCodeNavigationProp) => {
  if (!hookProps.state.selectedStationCode) {
    Alert.alert('', 'Chưa chọn mã trạm');
    return;
  }

  let arrCodeBook: string[] = [];
  for (let item of hookProps.state.dataTabel) {
    if (item.checked && item.show) {
      arrCodeBook.push(item.bookCode);
    }
  }
  navigation.navigate('WriteBook', {
    bookCode: arrCodeBook,
    stationCode: hookProps.state.selectedStationCode,
  });
};

export function onSelectDatePress(date: DateTimePickerEvent) {
  console.log(JSON.stringify(date));

  if (date.type === 'set') {
    hookProps.setState(state => {
      state.dateLatch = new Date(date.nativeEvent.timestamp as string | number);
      return { ...state };
    });
  }
}
