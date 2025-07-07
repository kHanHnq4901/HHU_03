import { store } from '../../component/drawer/drawerContent/controller';
import { PropsKHCMISEntity } from '../entity';
import {
  KHCMISModelFields,
  PropsKHCMISModel,
  PropsPercentRead,
  PropsTypeOf,
  dataDBTabel,
} from '../model';
import { KHCMISRepository, PropsCondition } from '../repository';

interface ICMISKHServices {
  findAll: (
    pagination?: PropsPagination,
    condition?: PropsCondition,
  ) => Promise<PropsKHCMISModel[]>;
  findByColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<PropsKHCMISModel[]>;
  findUniqueValuesInColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<any[]>;
  update: (
    condition: PropsCondition,
    valueSet: { [key: string]: any },
  ) => Promise<boolean>;
  getPercentRead: () => Promise<PropsPercentRead>;
  getImage: (seri: string, loaiBCS: string) => Promise<string | null>;
}

export type PropsPagination = {
  page: number;
  totalPage?: number;
  itemPerPage: number;
};

export type PropsSorting = 'ascending' | 'descending';

export type PropsFilter = {
  idColumn: string;
  valueString?: string;
  startNumber?: string;
  endNumber?: string;
};

const convertEntity2Model = (entity: PropsKHCMISEntity): PropsKHCMISModel => {
  const model = {} as PropsKHCMISModel;
  for (let i = 0; i < KHCMISModelFields.length; i++) {
    model[KHCMISModelFields[i]] = entity[KHCMISModelFields[i]];
  }
  return model;
};

export const CMISKHServices = {} as ICMISKHServices;

CMISKHServices.findAll = async (
  pagination?: PropsPagination,
  condition?: PropsCondition,
) => {

  


  const items: PropsKHCMISModel[] = [];
  const entity = await KHCMISRepository.findAll(pagination, condition);
  for (let i = 0; i < entity.length; i++) {
    const rowKHCMISModel = convertEntity2Model(entity[i]);
    items.push(rowKHCMISModel);
  }
  
  return items;
};

CMISKHServices.findByColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
): Promise<PropsKHCMISModel[]> => {
  const items: PropsKHCMISModel[] = [];
  const entity = await KHCMISRepository.findByColumn(filter, pagination, sort);
  for (let i = 0; i < entity.length; i++) {
    items.push(convertEntity2Model(entity[i]));
  }
  return items;
};

CMISKHServices.findUniqueValuesInColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
): Promise<PropsKHCMISModel[]> => {
  return await KHCMISRepository.findUniqueValuesInColumn(
    filter,
    pagination,
    sort,
  );
};

CMISKHServices.update = async (
  condition: PropsCondition,
  valueSet: { [key: string]: any },
): Promise<boolean> => {
  return await KHCMISRepository.update(condition, valueSet);
};

CMISKHServices.getPercentRead = async () => {
  const result = await KHCMISRepository.getPercentRead();
  //console.log('resultbb:', result);
  return result;
};

CMISKHServices.getImage = async (seri: string, loaiBCS: string) => {
  return await KHCMISRepository.getImage(seri, loaiBCS);
}


export const GetImageInDB = CMISKHServices.getImage;
