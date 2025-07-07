import { Alert } from 'react-native';
import Share from 'react-native-share';
import { deleteFile } from '../../shared/file';
import { showToast } from '../../util';
import { hookProps, updateLogFile } from './controller';

export const onExportPress = () => {
  //controller.testMoveFile();

  let hasItem = false;
  const listUrl: string[] = [];
  //const filenames: string[] = [];
  for (let i = 0; i < hookProps.state.logList.length; i++) {
    if (hookProps.state.logList[i].checked === true) {
      hasItem = true;
      listUrl.push('file://' + hookProps.state.logList[i].path);
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
    type: 'text/plain',
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


export const onDeleteFilePress = async () => {
  let hasItem = false;
  let selectedItem = 0;
  for (let i = 0; i < hookProps.state.logList.length; i++) {
    if (hookProps.state.logList[i].checked === true) {
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
          for (let i = 0; i < hookProps.state.logList.length; i++) {
            if (hookProps.state.logList[i].checked === true) {
              await deleteFile(hookProps.state.logList[i].path);
            }
          }
          if (hasItem) {
            updateLogFile();
            //controller.();
          }
        },
      },
    ]);
    
  }
};


type PropsUpdateSentToDb = {
  
  seri: string;
  BCSCMIS: string;
  RfCode: string;
  isSentSucceed: boolean;
}

