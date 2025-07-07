import React, { useState } from 'react';
import { PropPushDataBookDLHN } from '../../component/bookPushServerDLHN';
import { PropsKHCMISModel } from '../../database/model';
import { CMISKHServices } from '../../database/service';
import { getLastPathImport } from '../../service/storage';
import {
  getListFileFromStorage,
  PropsFileInfo,
  writeXmlFile,
} from '../../shared/file';
import { PATH_EXPORT_XML } from '../../shared/path';
import { createXmlFile, exportDB2Xml } from '../../xml/xmlUtil';
import { IsAbnormal, IsReadRFSucceed, IsWriteByHand, TYPE_READ_RF } from '../../service/hhu/defineEM';
import { uniqueId } from 'lodash';
import { store } from '../../component/drawer/drawerContent/controller';
import { BookPushServer } from '../../component/bookPushServerDLHN/index';
import { showAlert, showSnack } from '../../util';

export type HookState = {
  xmlList: PropsFileInfo[];
  isBusy: boolean;
  bookPushServerDLHN: PropPushDataBookDLHN[];
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = 'Eport Xml Controller: ';

// const dumyList: PropsXml[] = [];

// for (let i = 0; i < 50; i++) {
//   dumyList.push({
//     checked: false,
//     name: 'Test' + i.toString() + '.xml',
//   });
// }

export const hookProps = {} as HookProps;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    xmlList: [],
    isBusy: false,
    bookPushServerDLHN: [],
  });
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};
// console.log(RNFS.ExternalDirectoryPath); ///storage/emulated/0/Android/data/com.gelex.emic.hhuem/files
// console.log(RNFS.DocumentDirectoryPath); ///data/user/0/com.gelex.emic.hhuem/files
// console.log(RNFS.DownloadDirectoryPath); ////storage/emulated/0/Download
// console.log(RNFS.ExternalStorageDirectoryPath); ////storage/emulated/0
// console.log(RNFS.MainBundlePath); //undefined



export const updateXmlFile = async () => {
  const numFileCreateSuccess = await createXmlFile();
  if(numFileCreateSuccess)

    {
      console.log('here:', numFileCreateSuccess);
      //showSnack("hello");
      showSnack(`Đã cập nhập ${numFileCreateSuccess} file xml`);
    }
  const xmlList = await getListFileFromStorage(PATH_EXPORT_XML);
  // console.log('xmlList:', xmlList);

  hookProps.state.xmlList = xmlList;

  // hookProps.setState(state => {
  //   state.xmlList = xmlList;
  //   return { ...state };
  // });
};


const getListBookFromDb = async () => {
  let items: PropsKHCMISModel[];
  let dataDB: PropsKHCMISModel[] = [];
  //let stationCodeSet = new Set<string>();
  let totalMeterDBSet = new Set<string>();
  let maSoSet = new Set<string>();
  //let arrStationCode: string[] = [];

  console.log('getData DB');

  const listBookObj: PropPushDataBookDLHN[] = [];

  try {
    //if (store?.state.appSetting.showResultOKInWriteData === true) {
    items = await CMISKHServices.findAll();
    dataDB = items;
    for (let item of dataDB) {
      //stationCodeSet.add(item.MA_TRAM);
      totalMeterDBSet.add(item.SERY_CTO);
      maSoSet.add(item.MA_QUYEN);
    }


    const arrMaSo = Array.from(maSoSet);

    for(let maSo of arrMaSo)
    {
      const id = uniqueId();
      const book : PropPushDataBookDLHN = {
        id: id,
        checked: false,
        show: true,
        data: {
          maSo: '',
          ky: '',
          thang: '',
          nam: '',
          numSucceedRF: 0,
          numWriteByHand: 0,
          total: 0,
          numFailed: 0,
          numAbnormal: 0,
          numNotRead: 0,
          maDonViQLY: ''
        },
        onCheckedChange: function (): void {
          hookProps.setState(state => {
            for(let i = 0; i < state.bookPushServerDLHN.length; i++)
            {
              // console.log('i:', i);
              // console.log('index:', index);
              
              if(id === state.bookPushServerDLHN[i].id)
              {
                state.bookPushServerDLHN[i].checked = !state.bookPushServerDLHN[i].checked;
              }else{
                //state.bookPushServerDLHN[i].checked = false;
              }
            }
            //state.bookPushServerDLHN[index].checked = !state.bookServerDLHN[index].checked;
            return {...state}
          });
        }
      };
      
      let totalSucceedRF = 0;
      let totalWriteHand = 0;
      let totalFailed = 0;
      let totalAbnormal = 0;
      let totalNotRead = 0;
      let total = 0;
      for(let item of dataDB) {

          if(item.MA_QUYEN === maSo)
          {
            total ++;
            if(IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF))
            {
              totalSucceedRF ++;
              if(IsAbnormal(item.LoaiDoc as TYPE_READ_RF)){
                totalAbnormal ++;
              }
            }
            
            else if( IsWriteByHand(item.LoaiDoc as TYPE_READ_RF) )
            {

              totalWriteHand ++;
              
              if(IsAbnormal(item.LoaiDoc as TYPE_READ_RF)){
                totalAbnormal ++;
              }
              
            }
            // else if( IsAbnormal(item.LoaiDoc as TYPE_READ_RF))
            // {
            //   totalAbnormal ++;
            // }
            else if(item.LoaiDoc === TYPE_READ_RF.READ_FAILED)
            {
              totalFailed ++;
            }else{
              totalNotRead ++;
            }
            if(book.data.ky === '')
            {
              book.data.ky = item.KY;
              book.data.thang = item.THANG;
              book.data.nam = item.NAM;
              book.data.maDonViQLY = item.MA_DVIQLY;

            }
          }
      }

      book.data.numSucceedRF = totalSucceedRF;
      book.data.numWriteByHand = totalWriteHand;
      book.data.numFailed = totalFailed;
      book.data.numAbnormal = totalAbnormal;
      book.data.numNotRead = totalNotRead;
      book.data.total = total;

      book.data.maSo = maSo;

      listBookObj.push(book);

    }


    //console.log('set:', stationCodeSet);

    // = Array.from(stationCodeSet);
    //console.log('arrStationCode:', arrStationCode);

    hookProps.state.bookPushServerDLHN = listBookObj;
    // hookProps.setState(state => {
    //   //state.searchText = '';
    //   state.bookPushServerDLHN = listBookObj;
    //   return { ...state };
    // });
   
  } catch (err :any) {
    console.log(TAG, err.message);
  }
};


export const onInit = async navigation => {
  navigation.addListener('focus', async () => {
    //console.log('abcdjsdk');

    const loginMode = store.state.appSetting.loginMode;
    const isCMIS = store.state.appSetting.isCMISDLHN;

    hookProps.setState(state => {
      state.isBusy = true;
      return { ...state };
    });

    if(loginMode !== 'ĐL Hà Nội')
    {
      await updateXmlFile();
    }else{
      await getListBookFromDb();
    }
    
    
    hookProps.setState(state => {
      state.isBusy = false;
      return { ...state };
    });
  });
};

export const onDeInit = () => {};
