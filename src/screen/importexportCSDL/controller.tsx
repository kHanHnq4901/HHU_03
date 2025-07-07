import React, { useState } from 'react';
import RNFS from 'react-native-fs';
import { PropsFileInfo, deleteFile } from '../../shared/file';
import { PATH_IMPORT_CSDL, PATH_EXECUTE_CSDL } from '../../shared/path';
import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { RECEIVE_FILE_CSDL } from '../../service/event/constant';
import { getFilExtension, showToast, toLocaleString } from '../../util';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { DrawerParamsList } from '../../navigation/model/model';

export type PropsXml = PropsFileInfo;

type HookState = {
  csdlList: PropsFileInfo[];
};

type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = 'Import Export CSDL Controller: ';

export let hookProps = {} as HookProps;
let navigation : NavigationProp<DrawerParamsList> ;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    csdlList: [],
  });
  hookProps.state = state;
  hookProps.setState = setState;
  navigation = useNavigation();

  return hookProps;
};

let listenReceiveCSDL: EmitterSubscription;

export const onInit = async () => {

  navigation.addListener( 'focus', () => {
    loadFileCsdlFromStorage();
  });
  

  listenReceiveCSDL = DeviceEventEmitter.addListener(RECEIVE_FILE_CSDL, () => {
    loadFileCsdlFromStorage();
  });
};

export const onDeInit = () => {
  listenReceiveCSDL.remove();
  navigation.removeListener('focus', () => {});
};


async function AutoClearDbBackup(listFile: PropsFileInfo[]){

  const listFileReal: PropsFileInfo[] =  [];
  const numDayExpire = 30;
  const expireTime = numDayExpire * 24 *60 * 60 * 1000;
  const date = new Date();
  const currentTime = date.getTime();
  for(let file of listFile){

     const fileTime = file.time;

     if(currentTime - fileTime > expireTime )
     {
      await deleteFile(file.path);
     }else{
      listFileReal.push(file);
     }

  }

  return listFileReal;
}

export const loadFileCsdlFromStorage = () => {
  console.log('load file csdl');
  RNFS.readDir(PATH_IMPORT_CSDL) //fsd On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
    .then(async result => {
      //console.log('GOT RESULT', JSON.stringify(result));
      
      let listFile : PropsFileInfo[] = [];
      result.forEach(e => {
        if (getFilExtension(e.name.toLocaleLowerCase()) === 'db') {
          listFile.push({
            name: e.name,
            checked: false,
            time: new Date(e.mtime).getTime(),
            path: e.path,
            date: toLocaleString(new Date(e.mtime)),
          });
        }
      });

      listFile = await AutoClearDbBackup(listFile);

      listFile = listFile.sort((a, b) => b.time - a.time);
      hookProps.setState(state => {
        state.csdlList = listFile;
        
        //console.log('b');
        return { ...state };
      });
    })
    .catch(err => {
      console.log(TAG, 'Error: ', err.message, err.code);
      showToast(err.message);
    });
};
