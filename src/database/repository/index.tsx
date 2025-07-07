import SQLite from 'react-native-sqlite-storage';
import { TYPE_READ_RF } from '../../service/hhu/defineEM';
import { NAME_CSDL, PATH_EXECUTE_CSDL, PATH_EXPORT_CSDL } from '../../shared/path';
import { isNumeric, showAlert } from '../../util';
import { dumyEntity, GetStringSelectEntity, PropsKHCMISEntity, TABLE_NAME } from '../entity';
import { dataDBTabel, getTypeOfColumn, PropsPercentRead } from '../model';
import { PropsFilter, PropsPagination, PropsSorting } from '../service';
import RNFS from 'react-native-fs';
import { getStringTime } from '../../screen/importexportCSDL/handleButton';
import { getLastPathImport } from '../../service/storage';
import { store } from '../../component/drawer/drawerContent/controller';

const TAG = 'Repository:';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export const checkTabelDBIfExist = async (): Promise<boolean> => {
  try {
    if ((await getDBConnection()) === false) {
      return false;
    }
    //const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=${TABLE_NAME}`;
    let query = `create table if not exists ${TABLE_NAME} (`;
    let first: boolean;
    first = true;
    for (let i in dumyEntity) {
      if (first === true) {
        first = false;
      } else {
        query += ',';
      }

      query += i;
    }
    query += ')';
    const results = await db?.executeSql(query);

    //console.log('query: ', query);
    console.log('create table if exist: ');
  } catch (err :any) {
    console.log(TAG, 'err tabel exist: ', err.message);
  }
  return false;
};


export async function BackupDb(){


 // backup
 try {
  console.log('move file');
  const path = await  getLastPathImport();

  let fileName: string = '';
  try{
    const arrPath = path.split('/');
    fileName = arrPath[arrPath.length - 1].split('.')[0];
  }catch{
    fileName = 'noname';
  }

  console.log('fileName:', fileName);
  
  await RNFS.copyFile(
    'file://' + PATH_EXECUTE_CSDL + '/' + NAME_CSDL,
    PATH_EXPORT_CSDL +
      '/' +
      fileName +
      '_' +
      getStringTime() +
      '.db',
  );
  console.log(TAG, 'coppy file to ' + PATH_EXPORT_CSDL);
  //showAlert('test backup thanhf coong');
} catch (err :any) {
  console.log(TAG, 'Err: ' + err.message);
}


}

export const deleteDataDB = async (): Promise<boolean> => {
  try {
    if ((await getDBConnection()) === false) {
      return false;
    }

    await BackupDb();

    //const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=${TABLE_NAME}`;
    // let query = `DELETE FROM ${TABLE_NAME};`;
    let query = `DROP TABLE IF EXISTS ${TABLE_NAME};`;
    const results = await db?.executeSql(query);
    console.log('deletedb: ', results);
    await checkTabelDBIfExist();
    return true;
  } catch (err :any) {
    console.log(TAG, 'err tabel exist: ', err.message);
  }
  return false;
};

export const getDBConnection = async (): Promise<boolean> => {
  let succeed = false;
  if (!db) {
    console.log('get db');
    // console.log(NAME_CSDL.split('.')[0]);
    // console.log(PATH_EXECUTE_CSDL + '/' + NAME_CSDL);
    succeed = await new Promise(async resolve => {
      db = await SQLite.openDatabase(
        {
          name: NAME_CSDL,
          location: 'default',
        },
        () => {
          resolve(true);
        },
        err => {
          console.log('open SQL error:' + err);
          db = null;
          resolve(false);
        },
      );
    });
    //await sleep(500);
    //console.log(await db.executeSql('database tables'));
  } else {
    succeed = true;
  }
  //console.log('succeed:', succeed);
  return succeed;
};

export type PropsCondition = {
  data: { [key: string]: any } | { [key: string]: any }[];
  logic: '=' | '!=' | '<=' | '>=';
  operator: 'AND' | 'OR' | 'LIKE' | '';
};

export interface ICMISKHRepository {
  findAll: (
    pagination?: PropsPagination,
    condition?: PropsCondition,
  ) => Promise<PropsKHCMISEntity[]>;
  findByColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<PropsKHCMISEntity[]>;
  findUniqueValuesInColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<any[]>;
  update: (
    condition: PropsCondition,
    valueSet: { [key: string]: any },
  ) => Promise<boolean>;
  save: (item: PropsKHCMISEntity) => Promise<boolean>;
  getPercentRead: () => Promise<PropsPercentRead>;
  getImage: (seri: string, loaiBCS: string) => Promise<string | null>;
}
export const closeConnection = async () => {
  if (db) {
    console.log('close db connection');

    await db.close();
    db = null;
    return;
  }
};

export const KHCMISRepository = {} as ICMISKHRepository;

const filterArr = (items: any[], pagination: PropsPagination): any[] => {
  pagination.itemPerPage = pagination.itemPerPage ?? 1;
  pagination.totalPage = Math.floor(items.length / pagination.itemPerPage) + 1;
  const startIndex = pagination.page * pagination.itemPerPage;
  const endIndex =
    pagination.page * pagination.itemPerPage + pagination.itemPerPage;
  // console.log('startIndex', startIndex);
  // console.log('endIndex', endIndex);
  items = items.filter(
    (item, index) => index >= startIndex && index < endIndex,
  );
  return items;
};

KHCMISRepository.findAll = async (
  pagination?: PropsPagination,
  condition?: PropsCondition,
) => {
  let items: PropsKHCMISEntity[] = [];
  try {
    if ((await getDBConnection()) === false) {
      return items;
    }
    let query = `SELECT ${GetStringSelectEntity()} FROM ${TABLE_NAME}`;
    if (condition) {
      let first = true;
      query += `
      WHERE 
      `;
      if (Array.isArray(condition.data) === false) {
        for (let i in condition.data) {
          if (first === true) {
            first = false;
          } else {
            query += ' ' + condition.operator + ' ';
          }

          query +=
            i +
            ' ' +
            condition.logic +
            ' ' +
            convertStringSpecial(condition.data[i]);
        }
      } else {
        for (let obj of condition.data as { [key: string]: any }[]) {
          for (let i in obj) {
            if (first === true) {
              first = false;
            } else {
              query += ' ' + condition.operator + ' ';
            }

            query +=
              i + ' ' + condition.logic + ' ' + convertStringSpecial(obj[i]);
          }
        }
      }

      query += ';';
    }
    //console.log('query:', query);
    const results = await db?.executeSql(query);
    //console.log(results);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        // if (index === 0) {
        //   console.log('result.rows.item(index):', result.rows.item(index));
        // }
        items.push(result.rows.item(index));
      }
    });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  const isGetOnlyInteger = store.state.appSetting.hhu.isOnlyGetIntegers;
  // if(rowKHCMISModel.SERY_CTO === '17306890' && rowKHCMISModel.LOAI_BCS === 'SG')
  //   {
  //     console.log('test here');
  //     console.log('isGetOnlyInteger:', isGetOnlyInteger);
  //     console.log('CS_MOI:', rowKHCMISModel.CS_MOI);
  //     console.log('CS_MOI after:', Number(Number(rowKHCMISModel.CS_MOI).toFixed(0)));
  //     // console.log('isGetOnlyInteger:', isGetOnlyInteger);
  //     // console.log('isGetOnlyInteger:', isGetOnlyInteger);
      
  //   }


  if(isGetOnlyInteger)
  {
    for(let item of items)
    {
      item.CS_MOI = Math.floor(Number(item.CS_MOI)).toString();
      item.CS_CU = Math.floor(Number(item.CS_CU)).toString();
      item.SL_MOI = Math.floor(Number(item.SL_MOI)).toString();
      item.SL_CU = Math.floor(Number(item.SL_CU)).toString();
      item.PMAX = Math.floor(Number(item.PMAX)).toString();
    }
  }
  return items;
};

KHCMISRepository.findByColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
) => {
  let items: PropsKHCMISEntity[] = [];
  try {
    if ((await getDBConnection()) === false) {
      return items;
    }

    let clause: string = '';
    const type = getTypeOfColumn(filter.idColumn);
    if (type === 'number') {
      if (isNumeric(filter.startNumber) === false) {
        return items;
      }
      if (isNumeric(filter.endNumber) === true) {
        clause = `WHERE ${filter.idColumn} BETWEEN ${Number(
          filter.startNumber,
        )} AND ${Number(filter.endNumber)} `;
      } else {
        clause = `WHERE ${filter.idColumn} = ${Number(filter.startNumber)}`;
      }
    } else if (type === 'string') {
      clause = `WHERE ${
        filter?.idColumn
      } LIKE '%${filter.valueString?.trim()}%'`;
    } else {
      console.log(TAG, 'No type suitable filter database');
      return items;
    }

    if (sort) {
      if (sort === 'ascending') {
        clause += ` ORDER BY ${filter.idColumn} ASC`;
      } else {
        clause += ` ORDER BY ${filter.idColumn} DESC`;
      }
    }
    const query = `SELECT ${GetStringSelectEntity()} FROM ${TABLE_NAME} ` + clause;
    //console.log(TAG, query);
    const results = await db?.executeSql(query);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

KHCMISRepository.findUniqueValuesInColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
) => {
  let items: any[] = [];
  let clause: string = '';
  if (sort) {
    if (sort === 'ascending') {
      clause += ` ORDER BY ${filter.idColumn} ASC`;
    } else {
      clause += ` ORDER BY ${filter.idColumn} DESC`;
    }
  }
  try {
    if ((await getDBConnection()) === false) {
      return items;
    }
    const query =
      `SELECT DISTINCT ${filter.idColumn} FROM ${TABLE_NAME} ` + clause;
    const results = await db?.executeSql(query);
    results?.forEach(result => {
      
      
      for (let index = 0; index < result.rows.length; index++) {
        //console.log('result.rows.item(index):', result.rows.item(index)[filter.idColumn]);
        items.push( result.rows.item(index)[filter.idColumn]);
      }
    });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

const convertStringSpecial = (value :any): string => {
  if (typeof value === 'number') {
    return value.toString();
  } else {
    return '"' + value.toString() + '"';
  }
};

KHCMISRepository.update = async (
  condition: PropsCondition,
  valueSet: { [key: string]: any },
): Promise<boolean> => {
  if ((await getDBConnection()) === false) {
    return false;
  }
  let query: string = `UPDATE ${TABLE_NAME} 
  SET `;
  let first: boolean;
  first = true;
  for (let i in valueSet) {
    if (first === true) {
      first = false;
    } else {
      query += ', ';
    }

    query += i + ' = ' + convertStringSpecial(valueSet[i]);
  }
  query += `
  WHERE `;
  first = true;

  if (Array.isArray(condition.data) === false) {
    for (let i in condition.data) {
      if (first === true) {
        first = false;
      } else {
        query += ' ' + condition.operator + ' ';
      }

      query +=
        i +
        ' ' +
        condition.logic +
        ' ' +
        convertStringSpecial(condition.data[i]);
    }
  } else {
    for (let obj of condition.data as { [key: string]: any }[]) {
      for (let i in obj) {
        if (first === true) {
          first = false;
        } else {
          query += ' ' + condition.operator + ' ';
        }

        query += i + ' ' + condition.logic + ' ' + convertStringSpecial(obj[i]);
      }
    }
  }

  query += ';';
  // console.log(query);
  try {
    const results = (await db?.executeSql(query)) as [
      { rows: { length: number }; rowsAffected: number },
    ];
    console.log('result update: ' + JSON.stringify(results));
    if (results[0]?.rowsAffected > 0) {
      return true;
    }
  } catch (err :any) {
    console.log(TAG, 'result update: ', err.message);
    return false;
  }

  return false;
};

KHCMISRepository.getPercentRead = async (): Promise<PropsPercentRead> => {
  // not change position of element in result
  const result: PropsPercentRead = {
    readFailed: 0,
    writeByHand: 0,
    abnormalRead: 0,
    readSucceed: 0,
    haveNotRead: 0,
  };
  try {
    if ((await getDBConnection()) === false) {
      return result;
    }

    let clause: string;
    let query: string;
    let results:
      | [
          {
            insertId: any;
            rows: { item: any; length: number; raw: any };
            rowsAffected: number;
          },
        ]
      | undefined;
    query = `SELECT LoaiDoc FROM ${TABLE_NAME} `;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.HAVE_NOT_READ};`;
    results = await db?.executeSql(query + clause);
    //console.log('123:', results);
    result.haveNotRead = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.ABNORMAL_CAPACITY};`;
    results = await db?.executeSql(query + clause);
    result.abnormalRead = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.READ_FAILED};`;
    results = await db?.executeSql(query + clause);
    result.readFailed = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.READ_SUCCEED};`;
    results = await db?.executeSql(query + clause);
    result.readSucceed = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.WRITE_BY_HAND};`;
    results = await db?.executeSql(query + clause);
    result.writeByHand = results[0].rows.length;
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  console.log('result aa:', result);
  return result;
};

KHCMISRepository.save = async (item: PropsKHCMISEntity): Promise<boolean> => {
  try {
    if ((await getDBConnection()) === false) {
      return false;
    }

    let queryCheckExist = `SELECT id FROM ${TABLE_NAME}  WHERE id = "${item.id}";`; //'id'

    const res = await db?.executeSql(queryCheckExist);
    if (res) {
      if (res[0].rows.length > 0) {
        console.log('Item exist ' + item.id);
        return true;
      }
    }

    let query = `INSERT INTO ${TABLE_NAME} (`;
    let first: boolean;
    first = true;
    for (let i in item) {
      if (first === true) {
        first = false;
      } else {
        query += ',';
      }

      query += i;
    }
    query += `)
  VALUES
  (`;
    first = true;
    for (let i in item) {
      if (first === true) {
        first = false;
      } else {
        query += ',';
      }

      query += `"${item[i]}"`;
    }
    query += ');';
    //console.log('query:', query);
    
    await db?.executeSql(query);
    return true;
  } catch (error) {
    console.log(TAG, error.message);
  }
  return false;
};

KHCMISRepository.getImage = async (seri: string, loaiBCS: string) => {

  let str : string | null = null;
 
  let query = `SELECT ${dataDBTabel.image.id} FROM ${TABLE_NAME} WHERE 
  ${dataDBTabel.SERY_CTO.id} = "${seri}" AND ${dataDBTabel.LOAI_BCS.id} = "${loaiBCS}";`;

  const results = await db?.executeSql(query);

  if(results && results[0].rows.length)
  {
    //str = results[0].rows.item()
    const items : any[] = [];
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
    const res = items as [{"image": string}];
    str = res[0].image;
    
  }
  //console.log('results here:', str);
  return str;

}
