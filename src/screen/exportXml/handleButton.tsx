import Share from 'react-native-share';
import * as controller from './controller';
import { hookProps, updateXmlFile } from './controller';
import { showAlert, showToast } from '../../util';
import { showAlertDanger } from '../../service/alert';
import { deleteFile } from '../../shared/file';
import { Alert } from 'react-native';
import { store } from '../../component/drawer/drawerContent/controller';
import { navigation } from '../login/controller';
import { KHCMISRepository, PropsCondition } from '../../database/repository';
import { SoapPushDataFromDLHN, SoapPushDataFromDLHNCMIS, pushDataToServerDLHN, pushDataToServerNPC } from '../../service/api/serverData';
import { IsReadRFSucceed, IsWriteByHand, TYPE_READ_RF } from '../../service/hhu/defineEM';
import { checkUpdateFromStore } from '../../service/user';
import { dataDBTabel } from '../../database/model';
import { CMISKHServices } from '../../database/service';
import { PropsCommonResponse } from '../../service/api';
import { exportDB2XmlDLHN } from '../../xml/xmlDLHN';
import { getLastInfoDLHN } from '../../service/storage/storageDLHN';
import { exportDB2XmlDLHNCMIS } from '../../xml/xmlDLHNCMIS';

export const onExportPress = () => {
  //controller.testMoveFile();

  let hasItem = false;
  const listUrl: string[] = [];
  //const filenames: string[] = [];
  for (let i = 0; i < hookProps.state.xmlList.length; i++) {
    if (hookProps.state.xmlList[i].checked === true) {
      hasItem = true;
      listUrl.push('file://' + hookProps.state.xmlList[i].path);
      //filenames.push(hookProps.state.xmlList[i].name.split('.')[0]);
    }
  }
  if (hasItem === false) {
    showToast('Chưa có file nào được chọn');
    return;
  }

  //console.log('filenames:', filenames);

  Share.open({
    title: 'Chia sẻ qua',
    urls: listUrl,
    //filenames: filenames,
    type: 'application/xml',
    showAppsToView: true,
  })
    .then(res => {
      console.log(res);
      if(res.success)
      {
        // checkUpdateFromStore();
      }
    })
    .catch(err => {
      err && console.log(err);
    });
};

// export const onDeleteFilePress = async () => {
//   let hasItem = false;
//   let selectedItem = 0;
//   for (let i = 0; i < hookProps.state.xmlList.length; i++) {
//     if (hookProps.state.xmlList[i].checked === true) {
//       hasItem = true;
//       selectedItem++;
//     }
//   }
//   if (hasItem) {
//     showAlertDanger({
//       title: 'Xóa',
//       subtitle: 'Bạn có muốn xóa ' + selectedItem + ' file ?',
//       onOkPress: async () => {
//         for (let i = 0; i < hookProps.state.xmlList.length; i++) {
//           if (hookProps.state.xmlList[i].checked === true) {
//             await deleteFile(hookProps.state.xmlList[i].path);
//           }
//         }
//         if (hasItem) {
//           controller.loadXmlFromStorage();
//         }
//       },
//       onCancelPress: () => {},
//     });
//   }
// };

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
            //controller.();
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


type PropsUpdateSentToDb = {
  
  seri: string;
  BCSCMIS: string;
  RfCode: string;
  isSentSucceed: boolean;
}
export async function UpdateSentSucceedToDb(props: PropsUpdateSentToDb){
  
    const valuesSet = {};

    const condition: PropsCondition = {
      data: {},
      logic: '=',
      operator: 'AND',
    };

    //@ts-expect-error
    condition.data[dataDBTabel.SERY_CTO.id as string] = props.seri;
    //@ts-expect-error
    condition.data[dataDBTabel.LOAI_BCS.id as string] = props.BCSCMIS;
    //@ts-expect-error
    condition.data[dataDBTabel.RF.id as string] = props.RfCode;
    //@ts-expect-error
    valuesSet[dataDBTabel.isSent.id as string] = props.isSentSucceed ? "1" : "0";

    for (let i = 0; i < 3; i++) {
      const updateSucceed = await CMISKHServices.update(condition, valuesSet);
      if (updateSucceed) {
        console.log('update table succeed');
        return true;
      } else {
        console.log('update table failed');
      }
    }
}

export async function onExportFromServerPress() {
  if (store.state.appSetting.loginMode === 'KH Lẻ') {
    let ok = true;
    await showAlert(
      `Bạn có muốn chuyển đăng nhập 'ĐL Hà Nội' hoặc NPC ?`,
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
    let totalSucceed = 0;
    let total = 0;
    let totalValid = 0;
    let countSent = 0;

    try {
      hookProps.setState(state => {
        state.isBusy = true;
        return { ...state };
      });
      const repository = await KHCMISRepository.findAll();

      total = repository.length;

      // let countDagui = 0;
      // for (let item of repository)
      // {
      //   if (
      //     (item.loginMode === 'NPC'  /*|| item.loginMode === 'ĐL Hà Nội'*/) &&
      //     item.isSent !== '1' &&
      //     (IsWriteByHand(item.LoaiDoc as TYPE_READ_RF) ||
      //     IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF) 
      //       )
      //   )
      //   {

      //   }else{
      //     if((item.loginMode === 'NPC') &&
      //     item.isSent === '1')
      //     countDagui ++;
      //   }
      // }
      // console.log('DDax gui:', countDagui);
      
      let strInfo = '';

      for (let item of repository) {
        
        
        //console.warn('test login mode NPC');
        if (
          (item.loginMode === 'NPC'  /*|| item.loginMode === 'ĐL Hà Nội'*/) &&
          item.isSent !== '1' &&
          (IsWriteByHand(item.LoaiDoc as TYPE_READ_RF) ||
            IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF) 
            )
        ) {
          totalValid++;
          let ret : PropsCommonResponse = {
            bSucceed: false,
            strMessage: '',
            obj: null,
          }
          if(store.state.appSetting.loginMode === 'NPC')
          {
            ret = await pushDataToServerNPC(item);           
            //ret.bSucceed = true;
          }else{
            ret = await pushDataToServerDLHN(item);
          }

          strInfo = `,trạm ${item.MA_TRAM}, quyển ${item.MA_QUYEN}, seri ${item.SERY_CTO}, BCS ${item.LOAI_BCS}`;
          
          if (ret.bSucceed) {
            totalSucceed++;
            await UpdateSentSucceedToDb({
              seri: item.SERY_CTO,
              BCSCMIS: item.LOAI_BCS,
              RfCode: item.RF,
              isSentSucceed: true,
            });
          } else {
            //throw new Error(ret.strMessage);
            showAlert('Server:'+ ret.strMessage + strInfo);
          }
        }else{

          if (
              (item.loginMode === 'NPC') &&
              item.isSent === '1')
              {
                countSent ++;
              }
        }
      }
    } catch (err: any) {
      await showAlert('Lỗi:' + err.message);
    } finally {
      hookProps.setState(state => {
        state.isBusy = false;
        return { ...state };
      });
      showAlert(`
      Đẩy thành công ${totalSucceed} BCS. 
      
      Tổng đã gửi thành công: ${totalSucceed + countSent} / ${totalValid  + countSent} BCS
      Tổng ${total} BCS.`);
      //checkUpdateFromStore();
    }
  }else if(store.state.appSetting.loginMode === 'ĐL Hà Nội')
  {

    const isCMIS = store.state.appSetting.isCMISDLHN;

    try {

      let strXML : string | null = null;
      //if(isCMIS)
      if(true)
      {

        let numChecked = 0;
        const listBook = hookProps.state.bookPushServerDLHN;
        for(let book of listBook)
        {
          if(book.checked)
          {
            numChecked ++;
          }
        }

        if(numChecked > 0){

          let imp = false;
          if(numChecked > 1)
          {
            await showAlert( `Bạn có muốn đẩy ${numChecked} sổ không ?`, {
              label: 'Huỷ',
              func: () =>{},
            },{
              label: 'OK',
              func: () =>{
                imp = true;
                
              },
            });
          }else{
            imp = true;
          }

          if(imp)
          {
            hookProps.setState(state => {
              state.isBusy = true;
              return { ...state };
            });
            for(let book of listBook)
            {
              if(book.checked)
              {
                
                const infoExport = {
                  maSo: book.data.maSo,
                  ky: book.data.ky,
                  thang: book.data.thang,
                  nam: book.data.nam,
                };
                
                if(isCMIS)
                {
                  strXML = await exportDB2XmlDLHNCMIS(infoExport);
                }
                else{
                  strXML = await exportDB2XmlDLHN(infoExport);
                }

                if(strXML === null)
                {
                  throw(new Error('Không có dữ liệu XML'));
                }

                console.log(strXML);
                
                const infoDLHN = await getLastInfoDLHN();

                infoDLHN.maSoGCS = book.data.maSo;
                infoDLHN.ky = book.data.ky;
                infoDLHN.thang = book.data.thang;
                infoDLHN.nam = book.data.nam;
                infoDLHN.maDonvi = book.data.maDonViQLY;

                let ret : PropsCommonResponse = {
                  bSucceed: false,
                  obj: undefined,
                  strMessage: ''
                };
                if(isCMIS)
                {
                  ret = await SoapPushDataFromDLHNCMIS(
                    {
                      xml: strXML,
                      storageDLHN: infoDLHN,
                    }
                  );
                }else{

                  ret = await SoapPushDataFromDLHN(
                    {
                      xml: strXML,
                      storageDLHN: infoDLHN,
                    }
                  );

                }
                

                if(ret.bSucceed)
                {
                  showAlert(`Đã đẩy thành công sổ ${book.data.maSo} lên server`);
                }else{
                  //throw(new Error(ret.strMessage));
                  showAlert(`Lỗi đẩy sổ sổ ${book.data.maSo} lên server:` + ret.strMessage);
                }
              }
            }
          }

        }
         
      }
       
      // console.log('strXML:', strXML);

      

    } catch (err: any) {
      await showAlert('Lỗi:' + err.message);
    } finally {
      hookProps.setState(state => {
        state.isBusy = false;
        return { ...state };
      });
      
      //checkUpdateFromStore();
    }

    
    
  }
}
