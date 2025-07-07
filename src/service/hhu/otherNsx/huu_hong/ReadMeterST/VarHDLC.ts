import { bool, byte, int } from '../../../define';

type StReceiveFrame = {
  SegBit: byte;
  DestinationAddr: string;
  SourceAddr: string;
  ControlField: byte;
  informLen: int;
  Information: Buffer;
};

type meterReceiveFrame = {
  needFrameNum: int;
  haveFrameNum: int;
  recFrameData: StReceiveFrame[];
};

export class VarHDLC {
  public APDUMaxLen: int = 0;
  public bSegmented: bool = false;
  public bSendingDataBlock: bool = false;
  public bytClientRRR: byte = 1;
  public bytClientSSS: byte = 1;
  public bytServerRRR: byte = 0;
  public bytServerSSS: byte = 0;
  public HDLCMaxLen: int = 0;
  public LNServicesConformanceBlock: string = '007E1F';
  public recFrame: meterReceiveFrame = {
    needFrameNum: 0,
    haveFrameNum: 0,
    recFrameData: [],
  };
  public SNServicesConformanceBlock: string = '1C0320';
  public strApplicationContextNameLN: string = '60857405080101';
  public strApplicationContextNameSN: string = '60857405080102';
  public strDlmsReceiveFrame: string = '';
  public strFinal: string = '1';
  public strMechanismNameLowLevelSecurity: string = '60857405080201';
  public strMechanismNameNoSecurity: string = '60857405080200';
  public strPoll: string = '1';
  public strRestPDU: string = '';
  public strSegData: string = '';
  public strSentPDU: string = '';
}
