import { Platform, PermissionsAndroid } from 'react-native';
import * as permission from 'react-native-permissions';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { sleep } from '../../util';

const TAG = 'Request Permission: ';

export const requestPermissionGPSIos = async (): Promise<boolean> => {
  let result: permission.PermissionStatus = 'denied';
  let ok = false;

  result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

  switch (result) {
    case RESULTS.UNAVAILABLE:
      console.log(
        'This feature LOCATION_WHEN_IN_USE is not available (on this device / in this context)',
      );
      break;
    case RESULTS.DENIED:
      console.log(
        'The permission LOCATION_WHEN_IN_USE has not been requested / is denied but requestable',
      );
      break;
    case RESULTS.LIMITED:
      // console.log('The permission is limited: some actions are possible');
      ok = true;
      break;
    case RESULTS.GRANTED:
      // console.log('The permission is granted');
      ok = true;
      break;
    case RESULTS.BLOCKED:
      // console.log('The permission is denied and not requestable anymore');
      ok = true;
      break;
  }
  result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  ok = false;
  switch (result) {
    case RESULTS.UNAVAILABLE:
      console.log(
        'This feature LOCATION_WHEN_IN_USE is not available (on this device / in this context)',
      );
      break;
    case RESULTS.DENIED:
      console.log(
        'The permission LOCATION_WHEN_IN_USE has not been requested / is denied but requestable',
      );
      break;
    case RESULTS.LIMITED:
      // console.log('The permission is limited: some actions are possible');
      ok = true;
      break;
    case RESULTS.GRANTED:
      // console.log('The permission is granted');
      ok = true;
      break;
    case RESULTS.BLOCKED:
      // console.log('The permission is denied and not requestable anymore');
      ok = true;
      break;
  }

  return true;
};

export const requestPermissionGPSAndroid = async (): Promise<boolean> => {
  try {
    //let status;
    let result = await permission.check(
      permission.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    );
    switch (result) {
      case permission.RESULTS.UNAVAILABLE:
        console.log(
          TAG,
          'ACCESS_FINE_LOCATION',
          'This feature is not available (on this device / in this context)',
        );
        break;
      case permission.RESULTS.DENIED:
        console.log(
          TAG,
          'ACCESS_FINE_LOCATION',
          'The permission has not been requested / is denied but requestable',
        );
        // let status = await permission.request(
        //   permission.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        // );
        let status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (
          status === 'granted'
          
        ) {
          
          return true;
        } else {
          return false;
        }

      case permission.RESULTS.LIMITED:
        console.log(
          TAG,
          'ACCESS_FINE_LOCATION',
          'The permission is limited: some actions are possible',
        );
        break;
      case permission.RESULTS.GRANTED:
        console.log(TAG, 'ACCESS_FINE_LOCATION', 'The permission is granted');
        return true;
      case permission.RESULTS.BLOCKED:
        console.log(
          TAG,
          'ACCESS_FINE_LOCATION',
          'The permission is denied and not requestable anymore',
        );
        return true;
    }
    return false;
  } catch (err :any) {
    console.log(TAG, 'ACCESS_FINE_LOCATION', err.message);
    return false;
  }
};

export async function requestPermissionBleConnectAndroid(): Promise<boolean> {
  let ok = false;
  const OsVer = Number(Platform.constants.Version);
  //console.log('OsVer:', JSON.stringify(Platform));
  console.log('OsVer:', OsVer);
  if (OsVer >= 31) {
    //if (true) {
    let result = await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);

    switch (result) {
      case RESULTS.UNAVAILABLE:
        console.log(
          'This feature BLUETOOTH_CONNECT is not available (on this device / in this context)',
        );
        break;
      case RESULTS.DENIED:
        console.log(
          'The permission BLUETOOTH_CONNECT has not been requested / is denied but requestable',
        );
        break;
      case RESULTS.LIMITED:
        // console.log('The permission is limited: some actions are possible');
        ok = true;
        break;
      case RESULTS.GRANTED:
        // console.log('The permission is granted');
        ok = true;
        break;
      case RESULTS.BLOCKED:
        // console.log('The permission is denied and not requestable anymore');
        ok = true;
        break;
    }
    result = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
    ok = false;
    switch (result) {
      case RESULTS.UNAVAILABLE:
        console.log(
          'This feature BLUETOOTH_CONNECT is not available (on this device / in this context)',
        );
        break;
      case RESULTS.DENIED:
        console.log(
          'The permission BLUETOOTH_CONNECT has not been requested / is denied but requestable',
        );
        break;
      case RESULTS.LIMITED:
        // console.log('The permission is limited: some actions are possible');
        ok = true;
        break;
      case RESULTS.GRANTED:
        // console.log('The permission is granted');
        ok = true;
        break;
      case RESULTS.BLOCKED:
        // console.log('The permission is denied and not requestable anymore');
        ok = true;
        break;
    }
  } else {
    ok = true;
  }

  return ok;
}

export const requestPermissionWriteExternalStorage = async () => {
  try {
    //let status;

    if (Platform.OS === 'ios') {
      return true;
    }

    let result = await permission.check(
      permission.PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
    );
    switch (result) {
      case permission.RESULTS.UNAVAILABLE:
        console.log(
          TAG,
          'WRITE_EXTERNAL_STORAGE',
          'This feature is not available (on this device / in this context)',
        );
        break;
      case permission.RESULTS.DENIED:
        console.log(
          TAG,
          'WRITE_EXTERNAL_STORAGE',
          'The permission has not been requested / is denied but requestable',
        );
        let status = await permission.request(
          permission.PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        );
        if (
          status === permission.RESULTS.GRANTED ||
          status === permission.RESULTS.BLOCKED
        ) {
          return true;
        } else {
          return false;
        }

      case permission.RESULTS.LIMITED:
        console.log(
          TAG,
          'WRITE_EXTERNAL_STORAGE',
          'The permission is limited: some actions are possible',
        );
        break;
      case permission.RESULTS.GRANTED:
        //console.log(TAG, 'WRITE_EXTERNAL_STORAGE', 'The permission is granted');
        return true;
      case permission.RESULTS.BLOCKED:
        console.log(
          TAG,
          'WRITE_EXTERNAL_STORAGE',
          'The permission is denied and not requestable anymore',
        );
        return true;
    }
    return false;
  } catch (err :any) {
    console.log(TAG, 'WRITE_EXTERNAL_STORAGE', err.message);
    return false;
  }
};

export const requestPermissionScan = async (): Promise<boolean> => {
  let namePermission = 'requestPermissionScan:';
  let permissionID: any = null;
  try {
    let result: permission.PermissionStatus = 'denied';

    if (Platform.OS === 'android') {
      const OsVer = Number(Platform.constants.Version);

      //console.log('OsVer:', JSON.stringify(Platform));
      console.log('OsVer:', OsVer);

      if (OsVer < 31) {
        return true;
      }

      permissionID = permission.PERMISSIONS.ANDROID.BLUETOOTH_SCAN;

      namePermission = 'BLUETOOTH_SCAN';
    } else {
      permissionID = permission.PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL;

      namePermission = 'BLUETOOTH_PERIPHERAL';
    }

    result = await permission.check(permissionID);
    switch (result) {
      case permission.RESULTS.UNAVAILABLE:
        console.log(
          TAG,
          namePermission,
          'This feature is not available (on this device / in this context)',
        );
        break;
      case permission.RESULTS.DENIED:
        console.log(
          TAG,
          namePermission,
          'The permission has not been requested / is denied but requestable',
        );
        let status = await permission.request(permissionID);
        if (
          status === permission.RESULTS.GRANTED ||
          status === permission.RESULTS.BLOCKED
        ) {
          // console.log(TAG, namePermission, 'The permission is granted');
          return true;
        } else {
          return false;
        }

      case permission.RESULTS.LIMITED:
        console.log(
          TAG,
          namePermission,
          'The permission is limited: some actions are possible',
        );
        break;
      case permission.RESULTS.GRANTED:
        //console.log(TAG, namePermission, 'The permission is granted');
        return true;
      case permission.RESULTS.BLOCKED:
        console.log(
          TAG,
          namePermission,
          'The permission is denied and not requestable anymore',
        );
        return true;
    }
    return false;
  } catch (err :any) {
    console.log(TAG, namePermission, err.message);
    return false;
  }
};


export async function requestCameraPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      let result = await permission.check(
        permission.PERMISSIONS.ANDROID.CAMERA,
      );
      switch (result) {
        case permission.RESULTS.UNAVAILABLE:
          console.log(
            TAG,
            'CAMERA',
            'This feature is not available (on this device / in this context)',
          );
          break;
        case permission.RESULTS.DENIED:
          console.log(
            TAG,
            'CAMERA',
            'The permission has not been requested / is denied but requestable',
          );
          let status = await permission.request(
            permission.PERMISSIONS.ANDROID.CAMERA,
          );
          if (
            status === permission.RESULTS.GRANTED ||
            status === permission.RESULTS.BLOCKED
          ) {
            return true;
          } else {
            return false;
          }

        case permission.RESULTS.LIMITED:
          console.log(
            TAG,
            'CAMERA',
            'The permission is limited: some actions are possible',
          );
          break;
        case permission.RESULTS.GRANTED:
          //console.log(TAG, 'CAMERA', 'The permission is granted');
          return true;
        case permission.RESULTS.BLOCKED:
          console.log(
            TAG,
            'CAMERA',
            'The permission is denied and not requestable anymore',
          );
          return true;
      }
      return false;
    } catch (err :any) {
      console.log(TAG, 'CAMERA', err.message);
      return false;
    }
  }else{
    return true;
  }
}
