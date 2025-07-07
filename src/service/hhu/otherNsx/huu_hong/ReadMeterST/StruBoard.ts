import { bool } from '../../../define';
import { METERTYPE } from './METERTYPE';

export type StruBoard = {
  strnID: string[];
  strnVal: string[];
  sStateVal: string[];
  meterType: METERTYPE;
  DTS27_Flag: bool;
};
