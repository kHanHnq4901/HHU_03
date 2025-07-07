import { VersionMeterValue } from '../../service/hhu/defineEM';

export const TABLE_NAME_MATCH_SERI_VERSION = 'TBL_MATCH_SERI_VERSION';

export type PropsMatchSeriVersionEntity = {
  id: string;
  version: VersionMeterValue;
  min: number;
  max: number;
};

export const dumyEntityMatchSeriVersion: PropsMatchSeriVersionEntity = {
  id: '',
  version: '1',
  min: 0,
  max: 0,
};

type PropsObjDataTableMatchSeriVesrion = {
  [key in keyof PropsMatchSeriVersionEntity]: { id: string };
};

export const keyTableMatchSerialVersion: PropsObjDataTableMatchSeriVesrion = {
  id: { id: 'id' },
  version: { id: 'version' },
  min: { id: 'min' },
  max: { id: 'max' },
};
