import { Alert } from 'react-native';
import { deleteFile } from '../../shared/file';
import { hookProps, updateXmlFile } from './controller';

import { uniqueId } from 'lodash';
import { store } from '../../component/drawer/drawerContent/controller';
import { KHCMISRepository, deleteDataDB } from '../../database/repository';
import { GetMaSoAndDataFromDLHNCMIS, PropsSoapGetMaSoAndDataDLHNReturn, SoapGetMaSoAndDataFromDLHN, getDataFromServerNPC } from '../../service/api/serverData';
import { savePathImport } from '../../service/storage';
import { getLastInfoDLHN, saveInfoDLHN } from '../../service/storage/storageDLHN';
import { checkUpdateFromStore } from '../../service/user';
import { PATH_IMPORT_XML } from '../../shared/path';
import { showAlert } from '../../util';
import {
  convertDataServerToDataTabelDLHN,
  convertDataServerToDataTabelNPC,
  convertXmlTabelToRowCmis,
  importXmlFromPath,
} from '../../xml/xmlUtil';
import { navigation } from '../login/controller';
import { PropsCommonResponse } from '../../service/api';
import { TYPE_READ_RF } from '../../service/hhu/defineEM';
import { UpdateVersionToCurrentDb } from '../../database/service/matchSeriVersionService';

const TAG = 'HANDLE IMPORT XML';

export const onImportPress = async () => {
  // //controller.testMoveFile();
  // var obj = { name: 'Super', Surname: 'Man', age: 23 };
  // var builder = new xml2js.Builder();
  // var xml = builder.buildObject(obj);

  // console.log('k:', xml);

  // return;

  //checkUpdateFromStore();

  let hasItem = false;
  const listUrl: string[] = [];
  //const filenames: string[] = [];
  //console.log('lenghth:', hookProps.state.xmlList.length);
  for (let i = 0; i < hookProps.state.xmlList.length; i++) {
    if (hookProps.state.xmlList[i].checked === true) {
      hasItem = true;
      listUrl.push('file://' + hookProps.state.xmlList[i].path);
    }
  }
  if (hasItem === false) {
    Alert.alert('', 'Chưa có file nào được chọn');
    return;
  }
  // if (listUrl.length > 1) {
  //   Alert.alert('', 'Chỉ chọn được 1 file');
  //   return;
  // }

  console.log('listUrl.length:',listUrl.length);
  

  await importXmlFromPath(listUrl, 
  () => {
    hookProps.setState(state => {
      state.isBusy = true;
      return {...state};
    });
  },
  () => {
    hookProps.setState(state => {
      state.isBusy = false;
      return {...state};
    });
  },
);
};

export async function onImportDLHNPress(){
  if(hookProps.state.bookServerDLHN.length > 0){

    let numChecked = 0;
    for(let book of hookProps.state.bookServerDLHN)
    {
      if(book.checked){
        numChecked ++;
      }
    }
    if(numChecked > 0){

      let imp = false;
      if(numChecked > 1)
      {
        await showAlert( `Bạn có muốn nhập ${numChecked} sổ không ?`, {
          label: 'Huỷ',
          func: () =>{},
        },{
          label: 'Nhập',
          func: () =>{
            imp = true;
            
          },
        });
      }else{
        imp = true;
      }
      
      if(imp){
        const ok = await new Promise(resolve => {
          Alert.alert(
            'Xóa dữ liệu cũ và Nhập mới',
            'Dữ liệu cũ sẽ bị xóa ? \r\n\nBạn có thể xuất dữ liệu xml trước khi thực hiện thao tác này',
            [
              {
                text: 'Hủy',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {
                text: 'OK',
    
                onPress: async () => {
                  await deleteDataDB();
                  resolve(true);
                },
              },
            ],
          );
        });
        if(ok === false)
        {
          return;
        }

        
        const writeALl: boolean = await new Promise(resolve => {
          Alert.alert(
            'Ghi toàn bộ ?',
            'Bạn có muốn ghi lại cả những điểm đã ghi thành công không ?',
            [
              {
                text: 'Ghi toàn bộ',
                style: 'default',
                onPress: () => {
                  resolve(true);
                },
              },
              {
                text: 'Ghi điểm thiếu',
                style: 'default',
                onPress: () => {
                  resolve(false);
                },
              },
            ],
          );
        });
  
        console.log('Nhap .....');
        let succeed = false;
        let numBCS = 0;

        const bookServerDLHN = [...hookProps.state.bookServerDLHN];

        try {
          hookProps.setState(state => {
            state.isBusy = true;
            return { ...state };
          });
          if (true) {
            const dataTabel = convertDataServerToDataTabelDLHN(bookServerDLHN);
            numBCS = dataTabel.length;
            for (let i = 0; i < dataTabel.length; i++) {
              
              const tabel = dataTabel[i];
              if(writeALl === false)
              {
                if(tabel.CS_MOI && tabel.CS_MOI !== '0')
                {
                  continue;
                }
              }
              console.log('tabel.CS_MOI:', tabel.CS_MOI);

             
              
              const index = i + 1;
              const row = convertXmlTabelToRowCmis(tabel, index, store.state.appSetting.loginMode, store.state.appSetting.loginMode);

             

              const succeed = await KHCMISRepository.save(row);
              if (succeed === false) {
                await new Promise(resolve => {
                  Alert.alert('Lỗi', 'Nhập file lỗi', [
                    {
                      text: 'OK',
                      onPress: () => resolve(true),
                    },
                  ]);
                });
                throw new Error('Nhập dữ liệu thất bại');
              }
            }
            succeed = true;
          } 
        } catch (err :any) {
          showAlert('Lỗi: nhập dữ liệu thất bại: ' + err.message);
        } finally {
          for(let item of bookServerDLHN)
          {
            if(item.checked)
            {
             
              await saveInfoDLHN({
                maSoGCS: item.data.soGCS.MA_SOGCS,
                ky: item.data.soGCS.KY,
                nam: item.data.soGCS.NAM,
                thang: item.data.soGCS.THANG,
              
              });
              break;
            }
          }

          const storageDLHN = await getLastInfoDLHN();
          
          hookProps.setState(state => {
            state.infoDLHN.storage = storageDLHN;
            state.isBusy = false;
            return { ...state };
          });
          if (succeed) {
            const path = PATH_IMPORT_XML + '/DLHN.xml';
            console.log('pathSave:', path);

            await savePathImport(path);
            
            showAlert('Đã nhập xong ' + numBCS + ' BCS');

            //await UpdateVersionToCurrentDb();
          }
        }
      }
      
    }else{
      showAlert('Chưa có sổ nào được chọn');
    }

  }
}

export const onDeleteFilePress = async () => {
  let hasItem = false;
  let selectedItem = 0;
  for (let i = 0; i < hookProps.state.xmlList.length; i++) {
    if (hookProps.state.xmlList[i].checked === true) {
      hasItem = true;
      selectedItem++;
    }
  }
  if (hasItem) {
    Alert.alert('Xóa file ?', 'Bạn có muốn xóa ' + selectedItem + ' file ?', [
      {
        text: 'Hủy',
        style: 'cancel',
        onPress: () => {},
      },
      {
        text: 'Xóa',
        onPress: async () => {
          for (let i = 0; i < hookProps.state.xmlList.length; i++) {
            if (hookProps.state.xmlList[i].checked === true) {
              await deleteFile(hookProps.state.xmlList[i].path);
            }
          }
          if (hasItem) {
            updateXmlFile();
          }
        },
      },
    ]);
    // showAlertDanger({
    //   title: 'Xóa',
    //   subtitle: 'Bạn có muốn xóa ' + selectedItem + ' file ?',
    //   onOkPress: async () => {
    //     for (let i = 0; i < hookProps.state.xmlList.length; i++) {
    //       if (hookProps.state.xmlList[i].checked === true) {
    //         await deleteFile(hookProps.state.xmlList[i].path);
    //       }
    //     }
    //     if (hasItem) {
    //       //controller.();
    //     }
    //   },
    //   onCancelPress: () => {},
    // });
  }
};

export async function onImportFromServerPress() {
  if (store.state.appSetting.loginMode === 'KH Lẻ') {
    let ok = true;
    await showAlert(
      `Bạn có muốn chuyển chế độ đăng nhập 'ĐL Hà Nội' hoặc 'NPC' online ?`,
      {
        label: 'Huỷ',
        func: () => {},
      },
      {
        label: 'OK',
        func: () => {
          store.state.appSetting.loginMode = 'NPC';
          navigation.push('Login');
        },
      },
    );
  } else if(store.state.appSetting.loginMode === 'NPC') {
    //checkUpdateFromStore();
    const ok = await new Promise(resolve => {
      Alert.alert(
        'Xóa dữ liệu cũ và Nhập mới',
        'Dữ liệu cũ sẽ bị xóa ? \r\n\nBạn có thể xuất dữ liệu xml trước khi thực hiện thao tác này',
        [
          {
            text: 'Hủy',
            onPress: () => resolve(false),
            style: 'cancel',
          },
          {
            text: 'OK',

            onPress: async () => {
              await deleteDataDB();
              resolve(true);
            },
          },
        ],
      );
    });

    if (ok) {
      let succeed = false;
      let numBCS = 0;
      try {
        hookProps.setState(state => {
          state.isBusy = true;
          return { ...state };
        });
        const rest = await getDataFromServerNPC();
        if (rest.bSucceed) {
          const dataTabel = convertDataServerToDataTabelNPC(rest.obj);
          numBCS = dataTabel.length;
          for (let i = 0; i < dataTabel.length; i++) {
            const tabel = dataTabel[i];
            const index = i + 1;
            const row = convertXmlTabelToRowCmis(tabel, index, store.state.appSetting.loginMode, store.state.appSetting.loginMode);
            
            const succeed = await KHCMISRepository.save(row);
            if (succeed === false) {
              await new Promise(resolve => {
                Alert.alert('Lỗi', 'Nhập file lỗi', [
                  {
                    text: 'OK',
                    onPress: () => resolve(true),
                  },
                ]);
              });
              throw new Error('Nhập dữ liệu thất bại');
            }
          }
          succeed = true;
        } else {
          showAlert('Lỗi: ' + rest.strMessage);
        }
      } catch (err :any) {
        showAlert('Lỗi: nhập dữ liệu thất bại: ' + err.message);
      } finally {
        hookProps.setState(state => {
          state.isBusy = false;
          return { ...state };
        });
        if (succeed) {
          const path = PATH_IMPORT_XML + '/NPC.xml';
          console.log('pathSave:', path);

          await savePathImport(path);
          showAlert('Đã nhập xong ' + numBCS + ' BCS');
          //await UpdateVersionToCurrentDb();
        }
      }
    }
  }else if(store.state.appSetting.loginMode ==='ĐL Hà Nội')
  {
    try{

      const isCMIS = store.state.appSetting.isCMISDLHN;

      const maDonvi = hookProps.state.infoDLHN.storage.maDonvi.trim();
      

      hookProps.setState(state => {
        state.isBusy = true;
        return {...state};
      });

      let ret : PropsCommonResponse = {
        bSucceed: false,
        obj: undefined,
        strMessage: ''
      };

      if(isCMIS === true)
      {

        const ky = hookProps.state.infoDLHN.storage.ky.trim();
        const thang = hookProps.state.infoDLHN.storage.thang.trim();
        const nam = hookProps.state.infoDLHN.storage.nam.trim();
        const loaiCS = hookProps.state.infoDLHN.storage.loaiCS;

        saveInfoDLHN({
          maDonvi: maDonvi,
          ky: ky,
          thang: thang,
          nam: nam,
          loaiCS: loaiCS
        });

        ret = await GetMaSoAndDataFromDLHNCMIS({
          maDonvi: maDonvi,
          ky: ky,
          thang: thang,
          nam: nam,
          loaiCS: 'CSC'
        });
        

      }else{

        const maDoi = hookProps.state.infoDLHN.storage.maDoi.trim();

        saveInfoDLHN({
          maDonvi: maDonvi,
          maDoi: maDoi,
        });
  
          ret = await SoapGetMaSoAndDataFromDLHN({
          maDoi: maDoi,
          maDonvi: maDonvi
        });
      }
      if(ret.bSucceed)
      {
        const data = ret.obj as PropsSoapGetMaSoAndDataDLHNReturn[];
        hookProps.state.dataServerDLHN = data;
          //  console.log('data:', JSON.stringify(data));
           
           hookProps.state.bookServerDLHN = data.map((book, index) => {

            return {
              checked: false,
              id: uniqueId(),
              show: true,
              data: book,
              listNV: GetListNVFromBook(book),
              onCheckedChange: () => {
                hookProps.setState(state => {
                  for(let i = 0; i < state.bookServerDLHN.length; i++)
                  {
                    // console.log('i:', i);
                    // console.log('index:', index);
                    
                    if(i === index)
                    {
                      state.bookServerDLHN[i].checked = !state.bookServerDLHN[i].checked //;true;
                    }else{
                      //state.bookServerDLHN[i].checked = false;
                    }
                  }
                  // state.bookServerDLHN[index].checked = !state.bookServerDLHN[index].checked;
                  return {...state}
                });
              }
            }
           });

           hookProps.state.searchTotal =  data.length;
           hookProps.state.searchFound =  data.length;
        

      }else{

        showAlert('Lấy dữ liệu thất bại:' + ret.strMessage);
      }

    }catch(e : any)
    {
      showAlert('Lỗi: ' + e.message ?? String(e));
    }
    finally{
      hookProps.setState(state => {
        state.isBusy = false;
        return {...state};
      });
    }
    
    
  }
}

function GetListNVFromBook(book : PropsSoapGetMaSoAndDataDLHNReturn): string[]{

  const setNV = new Set<string>();

  book.danhSachBieu.forEach(item => {

    setNV.add(item.MA_NVGCS);
  });
  return Array.from(setNV);

}

export function onChangeTextSearch(text: string){

  let total = 0;
  let found = 0;

  const searchText = text.toLowerCase();
  hookProps.setState(state => {

    total ++;

    state.bookServerDLHN = state.bookServerDLHN.map(item => {
      if (item.data.soGCS.MA_SOGCS.toLowerCase().includes(searchText)) {
        item.show = true;
      } else {
        item.show = false;
      }
      if(!item.show)
      {
        for(let maNV of item.listNV)
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
}

