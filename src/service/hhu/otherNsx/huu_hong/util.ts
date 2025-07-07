import { GetByteArrayFromString, StringFromArray } from '../../../../util';
import { byte } from '../../define';
import { Buffer } from 'buffer';

export function EncodingASCIIGetString(
  byteArr: Buffer,
  index: number,
  count: number,
): string {
  return StringFromArray(byteArr, index, count);
}
export function EncodingDefaultGetBytes(str: string): Buffer {
  return Buffer.from(GetByteArrayFromString(str));
}
export function EncodingASCIIGetBytes(str: string): Buffer {
  return Buffer.from(GetByteArrayFromString(str));
}

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}

export function formatTimeHHM(date: Date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')
  );
}

export function ArrayCopy(
  source: Buffer,
  offsetSource: number,
  dest: Buffer,
  offsetDest: number,
  length: number,
) {
  let indexDest = offsetDest;
  for (let i = offsetSource; i < offsetSource + length; i++) {
    dest[indexDest] = source[i];
    indexDest++;
  }
}

export function getArrDataFromStringHHM(str: string): string[] {
  //const regexGetNumber = /(?<=\()[a-zA-z0-9\.\*]+(?=\))/g;  // ok
  const regexGetNumber = /(?<=\()[\w\.\*]+(?=\))/g;

  const result: string[] = [];
  var match;
  while ((match = regexGetNumber.exec(str)) != null) {
    result.push(match[0]);
  }

  return result;
}
