import React, { useState } from 'react';
import { PropsKHCMISModel, dataDBTabel } from '../../database/model';
import { PropsData } from './index';
import { GetImageInDB } from '../../database/service';
import { GetLoaiDocRFString, TYPE_READ_RF } from '../../service/hhu/defineEM';

export type HookState = {
  imageBase64: string| null;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = ' Controller WriteByHand: ';

export const hookProps = {
} as HookProps;

export const GetHook = (): HookProps => {
  const [state, setState] = useState<HookState>({
    imageBase64: null,
  });
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

export const onInit = async (item : PropsKHCMISModel) => {
  if(item.hasImage ==='1')
  {
    
    const bas64String = await GetImageInDB(item.SERY_CTO, item.LOAI_BCS);
    //console.log(bas64String);
    
    if(bas64String)
    {
      console.log('push image from db to hook');
      hookProps.setState(state => {
        state.imageBase64 = bas64String;
        return {...state}
      });
    }
    
  }
};

export const onBeforeInit = async () => {};

export const onDeInit = () => {};

export const getTableContent = (item: PropsKHCMISModel): PropsData => {
  const data: PropsData = [];

  for (let i in item) {
    if(
      i === dataDBTabel.RF.id ||
      i === dataDBTabel.X.id ||
      i === dataDBTabel.Y.id ||
      i === dataDBTabel.TT.id ||
      i === dataDBTabel.loginMode.id ||
      i === dataDBTabel.hasImage.id ||
      i === 'id'
      )
    {
      continue;
    }
    let content : string = '';
    if(i === dataDBTabel.LoaiDoc.id)
    {
      content = GetLoaiDocRFString(item[i] as TYPE_READ_RF);
    }else{
      content = item[i];
    }
    data.push({
      label: i,
      content: content,
    });
  }

  return data;
};
