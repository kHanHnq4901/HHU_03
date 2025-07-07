import { PropsResponse } from '../../aps/hhuAps';
import { ReadPower, ReadTSVH } from './hhuApsHHM';

type PropsReadApsGcsHHM = {
  seri: string;
};

export async function ReadApsGcsHHM(
  props: PropsReadApsGcsHHM,
): Promise<PropsResponse> {
  let rest = await ReadTSVH({
    seri: props.seri,
  });
  if (rest.bSucceed === false) {
    rest = await ReadPower({
      seri: props.seri,
    });
  }

  return rest;
}
