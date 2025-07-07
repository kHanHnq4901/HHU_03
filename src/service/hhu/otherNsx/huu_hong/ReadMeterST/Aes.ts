import { Buffer } from 'buffer';
import { byte } from '../../../define';

export enum KeySize {
  Bits128,
  Bits192,
  Bits256,
}

function gfmultby02(b: number): number {
  if (b < 0x80) {
    return 0xff & (b << 1);
  }
  return 0xff & ((b << 1) ^ 0x1b);
}

function gfmultby09(b: number): number {
  return 0xff & (gfmultby02(gfmultby02(gfmultby02(b))) ^ b);
}

function gfmultby0b(b: number): number {
  return 0xff & (gfmultby02(gfmultby02(gfmultby02(b))) ^ gfmultby02(b) ^ b);
}

function gfmultby0d(b: number): number {
  return (
    0xff &
    (gfmultby02(gfmultby02(gfmultby02(b))) ^ gfmultby02(gfmultby02(b)) ^ b)
  );
}

function gfmultby0e(b: number): number {
  return (
    0xff &
    (gfmultby02(gfmultby02(gfmultby02(b))) ^
      gfmultby02(gfmultby02(b)) ^
      gfmultby02(b))
  );
}

function gfmultby01(b: number): number {
  return b;
}

function gfmultby03(b: number): number {
  return 0xff & (gfmultby02(b) ^ b);
}

export class Aes {
  private iSbox: number[][] = [];
  private key: Buffer;
  private Nb: number = 0;
  private Nk: number = 0;
  private Nr: number = 0;
  private Rcon: number[][] = [];
  private Sbox: number[][] = [];
  private State: number[][] = [];
  private w: number[][] = [];

  public constructor(keySize: KeySize, keyBytes: Buffer) {
    this.SetNbNkNr(keySize);
    this.key = Buffer.alloc(this.Nk * 4);
    keyBytes.copy(this.key, 0);
    this.BuildSbox();
    this.BuildInvSbox();
    this.BuildRcon();
    this.KeyExpansion();
  }

  AddRoundKey = (round: number) => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.State[i][j] = 0xff & (this.State[i][j] ^ this.w[round * 4 + j][i]);
      }
    }
  };

  private BuildInvSbox() {
    this.iSbox = [
      [
        0x52, 9, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e,
        0x81, 0xf3, 0xd7, 0xfb,
      ],
      [
        0x7c, 0xe3, 0x39, 130, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44,
        0xc4, 0xde, 0xe9, 0xcb,
      ],
      [
        0x54, 0x7b, 0x94, 50, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 11,
        0x42, 250, 0xc3, 0x4e,
      ],
      [
        8, 0x2e, 0xa1, 0x66, 40, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d,
        0x8b, 0xd1, 0x25,
      ],
      [
        0x72, 0xf8, 0xf6, 100, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc,
        0x5d, 0x65, 0xb6, 0x92,
      ],
      [
        0x6c, 0x70, 0x48, 80, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 70, 0x57,
        0xa7, 0x8d, 0x9d, 0x84,
      ],
      [
        0x90, 0xd8, 0xab, 0, 140, 0xbc, 0xd3, 10, 0xf7, 0xe4, 0x58, 5, 0xb8,
        0xb3, 0x45, 6,
      ],
      [
        0xd0, 0x2c, 30, 0x8f, 0xca, 0x3f, 15, 2, 0xc1, 0xaf, 0xbd, 3, 1, 0x13,
        0x8a, 0x6b,
      ],
      [
        0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 220, 0xea, 0x97, 0xf2, 0xcf, 0xce,
        240, 180, 230, 0x73,
      ],
      [
        150, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8,
        0x1c, 0x75, 0xdf, 110,
      ],
      [
        0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 14,
        170, 0x18, 190, 0x1b,
      ],
      [
        0xfc, 0x56, 0x3e, 0x4b, 0xc6, 210, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe,
        120, 0xcd, 90, 0xf4,
      ],
      [
        0x1f, 0xdd, 0xa8, 0x33, 0x88, 7, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59,
        0x27, 0x80, 0xec, 0x5f,
      ],
      [
        0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 13, 0x2d, 0xe5, 0x7a, 0x9f,
        0x93, 0xc9, 0x9c, 0xef,
      ],
      [
        160, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 200, 0xeb, 0xbb, 60,
        0x83, 0x53, 0x99, 0x61,
      ],
      [
        0x17, 0x2b, 4, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 20, 0x63, 0x55,
        0x21, 12, 0x7d,
      ],
    ];
  }

  private BuildRcon() {
    this.Rcon = [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [8, 0, 0, 0],
      [0x10, 0, 0, 0],
      [0x20, 0, 0, 0],
      [0x40, 0, 0, 0],
      [0x80, 0, 0, 0],
      [0x1b, 0, 0, 0],
      [0x36, 0, 0, 0],
    ];
  }

  private BuildSbox() {
    this.Sbox = [
      [
        0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 1, 0x67, 0x2b,
        0xfe, 0xd7, 0xab, 0x76,
      ],
      [
        0xca, 130, 0xc9, 0x7d, 250, 0x59, 0x47, 240, 0xad, 0xd4, 0xa2, 0xaf,
        0x9c, 0xa4, 0x72, 0xc0,
      ],
      [
        0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1,
        0x71, 0xd8, 0x31, 0x15,
      ],
      [
        4, 0xc7, 0x23, 0xc3, 0x18, 150, 5, 0x9a, 7, 0x12, 0x80, 0xe2, 0xeb,
        0x27, 0xb2, 0x75,
      ],
      [
        9, 0x83, 0x2c, 0x1a, 0x1b, 110, 90, 160, 0x52, 0x3b, 0xd6, 0xb3, 0x29,
        0xe3, 0x2f, 0x84,
      ],
      [
        0x53, 0xd1, 0, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 190, 0x39,
        0x4a, 0x4c, 0x58, 0xcf,
      ],
      [
        0xd0, 0xef, 170, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 2, 0x7f, 80,
        60, 0x9f, 0xa8,
      ],
      [
        0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21,
        0x10, 0xff, 0xf3, 210,
      ],
      [
        0xcd, 12, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d,
        100, 0x5d, 0x19, 0x73,
      ],
      [
        0x60, 0x81, 0x4f, 220, 0x22, 0x2a, 0x90, 0x88, 70, 0xee, 0xb8, 20, 0xde,
        0x5e, 11, 0xdb,
      ],
      [
        0xe0, 50, 0x3a, 10, 0x49, 6, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91,
        0x95, 0xe4, 0x79,
      ],
      [
        0xe7, 200, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea,
        0x65, 0x7a, 0xae, 8,
      ],
      [
        0xba, 120, 0x25, 0x2e, 0x1c, 0xa6, 180, 0xc6, 0xe8, 0xdd, 0x74, 0x1f,
        0x4b, 0xbd, 0x8b, 0x8a,
      ],
      [
        0x70, 0x3e, 0xb5, 0x66, 0x48, 3, 0xf6, 14, 0x61, 0x35, 0x57, 0xb9, 0x86,
        0xc1, 0x1d, 0x9e,
      ],
      [
        0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 30, 0x87, 0xe9,
        0xce, 0x55, 40, 0xdf,
      ],
      [
        140, 0xa1, 0x89, 13, 0xbf, 230, 0x42, 0x68, 0x41, 0x99, 0x2d, 15, 0xb0,
        0x54, 0xbb, 0x16,
      ],
    ];
  }

  public Cipher(input: Buffer, output: Buffer) {
    this.State = [];
    for (let i = 0; i < 4; i++) {
      this.State.push(new Array(this.Nb));
    }
    for (let i = 0; i < 4 * this.Nb; i++) {
      this.State[i % 4][i / 4] = input[i];
    }
    this.AddRoundKey(0);
    for (let j = 1; j <= this.Nr - 1; j++) {
      this.SubBytes();
      this.ShiftRows();
      this.MixColumns();
      this.AddRoundKey(j);
    }
    this.SubBytes();
    this.ShiftRows();
    this.AddRoundKey(this.Nr);
    for (let k = 0; k < 4 * this.Nb; k++) {
      output[k] = this.State[k % 4][k / 4];
    }
  }

  public decrypt(input: Buffer, output: Buffer) {
    let dst: Buffer = Buffer.alloc(0x10);
    let buffer2: Buffer = Buffer.alloc(0x10);
    for (let i = 0; i < input.length; i += 0x10) {
      //Buffer.BlockCopy(input, i, dst, 0, 0x10);
      input.copy(dst, 0, i, i + 0x10);
      this.InvCipher(dst, buffer2);
      //Buffer.BlockCopy(buffer2, 0, output, i, 0x10);
      buffer2.copy(output, i, 0, 0 + 0x10);
    }
  }
  // public decrypt(input: Buffer, output: Buffer) {
  //   const outBuffer = Buffer.from(output);
  //   this.decryptBuffer(Buffer.from(input), outBuffer);
  //   for (let i = 0; i < outBuffer.length; i++) {
  //     output[i] = outBuffer[i];
  //   }
  // }

  //   public Dump() {
  //     console.log(
  //       string.Concat(
  //         'Nb = ' + this.Nb + ' Nk = ' + this.Nk + ' Nr = ' + this.Nr,
  //       ),
  //     );
  //     console.log('\nThe key is \n' + this.DumpKey());
  //     console.log('\nThe Sbox is \n' + this.DumpTwoByTwo(this.Sbox));
  //     console.log('\nThe w array is \n' + this.DumpTwoByTwo(this.w));
  //     console.log('\nThe State array is \n' + this.DumpTwoByTwo(this.State));
  //   }

  // public DumpKey(): string {
  //   let str: string = '';
  //   for (let i = 0; i < this.key.length; i++) {
  //     str = str + this.key[i].toString(16) + ' ';
  //   }
  //   return str;
  // }

  // public DumpTwoByTwo(a: number[][]): string {
  //   let str: string = '';
  //   for (let i = 0; i < a[0].length; i++) {
  //     let obj2 = str;
  //     str = obj2 + '[' + i + '] ';

  //     for (let j = 0; j < a[1].length; j++) {
  //       str = str + a[i][j].toString(16) + ' ';
  //     }
  //     str = str + '\n';
  //   }
  //   return str;
  // }

  private encrypt(input: Buffer, output: Buffer) {
    const dst: Buffer = Buffer.alloc(0x10);
    const buffer2: Buffer = Buffer.alloc(0x10);
    for (let i = 0; i < input.length; i += 0x10) {
      input.copy(dst, 0, i, i + 0x10);
      this.Cipher(dst, buffer2);
      buffer2.copy(output, 0, i, i + 0x10);
    }
  }

  // public encrypt(input: Buffer, output: Buffer) {
  //   const outBuffer = Buffer.from(output);
  //   this.encryptBuffer(Buffer.from(input), outBuffer);
  //   for (let i = 0; i < outBuffer.length; i++) {
  //     output[i] = outBuffer[i];
  //   }
  // }

  public InvCipher(input: Buffer, output: Buffer) {
    this.State = [];
    for (let i = 0; i < 4; i++) {
      this.State.push(new Array(this.Nb));
    }
    for (let i = 0; i < 4 * this.Nb; i++) {
      this.State[i % 4][i / 4] = input[i];
    }
    this.AddRoundKey(this.Nr);
    for (let j = this.Nr - 1; j >= 1; j--) {
      this.InvShiftRows();
      this.InvSubBytes();
      this.AddRoundKey(j);
      this.InvMixColumns();
    }
    this.InvShiftRows();
    this.InvSubBytes();
    this.AddRoundKey(0);
    for (let k = 0; k < 4 * this.Nb; k++) {
      output[k] = this.State[k % 4][k / 4];
    }
  }

  private InvMixColumns() {
    const buffer: number[][] = [];

    for (let i = 0; i < 4; i++) {
      buffer.push([0, 0, 0, 0]);
    }
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) {
        buffer[i][k] = this.State[i][k];
      }
    }
    for (let j = 0; j < 4; j++) {
      this.State[0][j] =
        0xff &
        (gfmultby0e(buffer[0][j]) ^
          gfmultby0b(buffer[1][j]) ^
          gfmultby0d(buffer[2][j]) ^
          gfmultby09(buffer[3][j]));
      this.State[1][j] =
        0xff &
        (gfmultby09(buffer[0][j]) ^
          gfmultby0e(buffer[1][j]) ^
          gfmultby0b(buffer[2][j]) ^
          gfmultby0d(buffer[3][j]));
      this.State[2][j] =
        0xff &
        (gfmultby0d(buffer[0][j]) ^
          gfmultby09(buffer[1][j]) ^
          gfmultby0e(buffer[2][j]) ^
          gfmultby0b(buffer[3][j]));
      this.State[3][j] =
        0xff &
        (gfmultby0b(buffer[0][j]) ^
          gfmultby0d(buffer[1][j]) ^
          gfmultby09(buffer[2][j]) ^
          gfmultby0e(buffer[3][j]));
    }
  }

  private InvShiftRows() {
    const buffer: number[][] = [];

    for (let i = 0; i < 4; i++) {
      buffer.push([0, 0, 0, 0]);
    }

    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) {
        buffer[i][k] = this.State[i][k];
      }
    }
    for (let j = 1; j < 4; j++) {
      for (let m = 0; m < 4; m++) {
        this.State[j][(m + j) % this.Nb] = buffer[j][m];
      }
    }
  }

  private InvSubBytes() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.State[i][j] =
          this.iSbox[this.State[i][j] >> 4][this.State[i][j] & 15];
      }
    }
  }

  private KeyExpansion() {
    this.w = [];
    for (let i = 0; i < this.Nb * (this.Nr + 1); i++) {
      this.w.push(new Array(4));
    }
    for (let i = 0; i < this.Nk; i++) {
      this.w[i][0] = this.key[4 * i];
      this.w[i][1] = this.key[4 * i + 1];
      this.w[i][2] = this.key[4 * i + 2];
      this.w[i][3] = this.key[4 * i + 3];
    }
    let word: Buffer = Buffer.alloc(4);
    for (let j = this.Nk; j < this.Nb * (this.Nr + 1); j++) {
      word[0] = this.w[j - 1][0];
      word[1] = this.w[j - 1][1];
      word[2] = this.w[j - 1][2];
      word[3] = this.w[j - 1][3];
      if (j % this.Nk === 0) {
        word = this.SubWord(this.RotWord(word));
        word[0] = 0xff & (word[0] ^ this.Rcon[j / this.Nk][0]);
        word[1] = 0xff & (word[1] ^ this.Rcon[j / this.Nk][1]);
        word[2] = 0xff & (word[2] ^ this.Rcon[j / this.Nk][2]);
        word[3] = 0xff & (word[3] ^ this.Rcon[j / this.Nk][3]);
      } else if (this.Nk > 6 && j % this.Nk === 4) {
        word = this.SubWord(word);
      }
      this.w[j][0] = 0xff & (this.w[j - this.Nk][0] ^ word[0]);
      this.w[j][1] = 0xff & (this.w[j - this.Nk][1] ^ word[1]);
      this.w[j][2] = 0xff & (this.w[j - this.Nk][2] ^ word[2]);
      this.w[j][3] = 0xff & (this.w[j - this.Nk][3] ^ word[3]);
    }
  }

  private MixColumns() {
    const buffer: number[][] = [];

    for (let i = 0; i < 4; i++) {
      buffer.push([0, 0, 0, 0]);
    }

    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) {
        buffer[i][k] = this.State[i][k];
      }
    }
    for (let j = 0; j < 4; j++) {
      this.State[0][j] =
        0xff &
        (gfmultby02(buffer[0][j]) ^
          gfmultby03(buffer[1][j]) ^
          gfmultby01(buffer[2][j]) ^
          gfmultby01(buffer[3][j]));
      this.State[1][j] =
        0xff &
        (gfmultby01(buffer[0][j]) ^
          gfmultby02(buffer[1][j]) ^
          gfmultby03(buffer[2][j]) ^
          gfmultby01(buffer[3][j]));
      this.State[2][j] =
        0xff &
        (gfmultby01(buffer[0][j]) ^
          gfmultby01(buffer[1][j]) ^
          gfmultby02(buffer[2][j]) ^
          gfmultby03(buffer[3][j]));
      this.State[3][j] =
        0xff &
        (gfmultby03(buffer[0][j]) ^
          gfmultby01(buffer[1][j]) ^
          gfmultby01(buffer[2][j]) ^
          gfmultby02(buffer[3][j]));
    }
  }

  public resize2AES128(sendbytes: Buffer) {
    let num: number = sendbytes.length % 0x10;
    if (num === 0) {
    }
  }

  private RotWord(word: Buffer): Buffer {
    return Buffer.from([word[1], word[2], word[3], word[0]]);
  }

  SetNbNkNr = (keySize: KeySize) => {
    this.Nb = 4;
    if (keySize === KeySize.Bits128) {
      this.Nk = 4;
      this.Nr = 10;
    } else if (keySize === KeySize.Bits192) {
      this.Nk = 6;
      this.Nr = 12;
    } else if (keySize === KeySize.Bits256) {
      this.Nk = 8;
      this.Nr = 14;
    }
  };

  private ShiftRows() {
    const buffer: number[][] = [];

    for (let i = 0; i < 4; i++) {
      buffer.push([0, 0, 0, 0]);
    }

    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) {
        buffer[i][k] = this.State[i][k];
      }
    }
    for (let j = 1; j < 4; j++) {
      for (let m = 0; m < 4; m++) {
        this.State[j][m] = buffer[j][(m + j) % this.Nb];
      }
    }
  }

  private SubBytes() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.State[i][j] =
          this.Sbox[this.State[i][j] >> 4][this.State[i][j] & 15];
      }
    }
  }

  private SubWord = (word: Buffer): Buffer => {
    return Buffer.from([
      this.Sbox[word[0] >> 4][word[0] & 15],
      this.Sbox[word[1] >> 4][word[1] & 15],
      this.Sbox[word[2] >> 4][word[2] & 15],
      this.Sbox[word[3] >> 4][word[3] & 15],
    ]);
  };
}

// import { byte, int } from "../../../define";

// const TAG = 'AES: ';

// export enum KeySize
// {
//     Bits128,
//     Bits192,
//     Bits256
// }

// export class Aes
//     {
//         private iSbox : Buffer[];
//         private key : Buffer;
//         private  Nb :int;
//         private  Nk:int;
//         private  Nr:int;
//         private Rcon :Buffer[];
//         private  Sbox:Buffer[];
//         private State:Buffer[];
//         private  w:Buffer[];

//         public Aes(keySize: KeySize,  keyBytes :Buffer)
//         {
//             this.SetNbNkNr(keySize);
//             this.key = Buffer.alloc(this.Nk * 4);
//             keyBytes.CopyTo(this.key, 0);
//             this.BuildSbox();
//             this.BuildInvSbox();
//             this.BuildRcon();
//             this.KeyExpansion();
//         }

//         private AddRoundKey( round : int) : void
//         {
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let j : int = 0; j < 4; j++)
//                 {
//                     this.State[i, j] = 0xff &  (this.State[i, j] ^ this.w[(round * 4) + j, i]);
//                 }
//             }
//         }

//         private  BuildInvSbox() : void
//         {
//             this.iSbox = [[ 0x52, 9, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb ], [ 0x7c, 0xe3, 0x39, 130, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb ], [ 0x54, 0x7b, 0x94, 50, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 11, 0x42, 250, 0xc3, 0x4e ], [ 8, 0x2e, 0xa1, 0x66, 40, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25 ], [ 0x72, 0xf8, 0xf6, 100, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92 ], [ 0x6c, 0x70, 0x48, 80, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 70, 0x57, 0xa7, 0x8d, 0x9d, 0x84 ], [ 0x90, 0xd8, 0xab, 0, 140, 0xbc, 0xd3, 10, 0xf7, 0xe4, 0x58, 5, 0xb8, 0xb3, 0x45, 6 ], [ 0xd0, 0x2c, 30, 0x8f, 0xca, 0x3f, 15, 2, 0xc1, 0xaf, 0xbd, 3, 1, 0x13, 0x8a, 0x6b ], [ 0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 220, 0xea, 0x97, 0xf2, 0xcf, 0xce, 240, 180, 230, 0x73 ], [ 150, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 110 ], [ 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 14, 170, 0x18, 190, 0x1b ], [ 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 210, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 120, 0xcd, 90, 0xf4 ], [ 0x1f, 0xdd, 0xa8, 0x33, 0x88, 7, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f ], [ 0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 13, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef ], [ 160, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 200, 0xeb, 0xbb, 60, 0x83, 0x53, 0x99, 0x61 ], [ 0x17, 0x2b, 4, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 20, 0x63, 0x55, 0x21, 12, 0x7d ]];
//         }

//         private  BuildRcon()
//         {
//             this.Rcon = [[ 0, 0, 0, 0 ], [ 1, 0, 0, 0 ], [ 2, 0, 0, 0 ], [ 4, 0, 0, 0 ], [ 8, 0, 0, 0 ], [ 0x10, 0, 0, 0 ], [ 0x20, 0, 0, 0 ], [ 0x40, 0, 0, 0 ], [ 0x80, 0, 0, 0 ], [ 0x1b, 0, 0, 0 ], [ 0x36, 0, 0, 0 ] ];
//         }

//         private  BuildSbox()
//         {
//             this.Sbox = [[ 0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 1, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76 ], [ 0xca, 130, 0xc9, 0x7d, 250, 0x59, 0x47, 240, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0 ], [ 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15 ], [ 4, 0xc7, 0x23, 0xc3, 0x18, 150, 5, 0x9a, 7, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75 ], [ 9, 0x83, 0x2c, 0x1a, 0x1b, 110, 90, 160, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84 ], [ 0x53, 0xd1, 0, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 190, 0x39, 0x4a, 0x4c, 0x58, 0xcf ], [ 0xd0, 0xef, 170, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 2, 0x7f, 80, 60, 0x9f, 0xa8 ], [ 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 210 ], [ 0xcd, 12, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 100, 0x5d, 0x19, 0x73 ], [ 0x60, 0x81, 0x4f, 220, 0x22, 0x2a, 0x90, 0x88, 70, 0xee, 0xb8, 20, 0xde, 0x5e, 11, 0xdb ], [ 0xe0, 50, 0x3a, 10, 0x49, 6, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79 ], [ 0xe7, 200, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 8 ], [ 0xba, 120, 0x25, 0x2e, 0x1c, 0xa6, 180, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a ], [ 0x70, 0x3e, 0xb5, 0x66, 0x48, 3, 0xf6, 14, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e ], [ 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 30, 0x87, 0xe9, 0xce, 0x55, 40, 0xdf ], [ 140, 0xa1, 0x89, 13, 0xbf, 230, 0x42, 0x68, 0x41, 0x99, 0x2d, 15, 0xb0, 0x54, 0xbb, 0x16 ] ];
//         }

//         public  Cipher( input:Buffer, output : Buffer)
//         {
//             this.State = [];
//             for (let i = 0; i < 4; i++) {
//                 this.State.push(new Array(this.Nb));
//             }
//             for (let i = 0; i < 4 * this.Nb; i++) {
//                 this.State[i % 4][i / 4] = input[i];
//             }
//             this.AddRoundKey(0);
//             for (let j :int = 1; j <= (this.Nr - 1); j++)
//             {
//                 this.SubBytes();
//                 this.ShiftRows();
//                 this.MixColumns();
//                 this.AddRoundKey(j);
//             }
//             this.SubBytes();
//             this.ShiftRows();
//             this.AddRoundKey(this.Nr);
//             for (let k :int = 0; k < (4 * this.Nb); k++)
//             {
//                 output[k] = this.State[k % 4, k / 4];
//             }
//         }

//         public  decrypt(input :Buffer , ref Buffer output)
//         {
//             Buffer dst = Buffer.alloc(0x10];
//             Buffer buffer2 = Buffer.alloc(0x10];
//             for (let i = 0; i < input.length; i += 0x10)
//             {
//                 Buffer.BlockCopy(input, i, dst, 0, 0x10);
//                 this.InvCipher(dst, ref buffer2);
//                 Buffer.BlockCopy(buffer2, 0, output, i, 0x10);
//             }
//         }

//         public Dump()
//         {
//             console.log( TAG, [ "Nb = ", this.Nb, " Nk = ", this.Nk, " Nr = ", this.Nr ]);
//             console.log( TAG, "\nThe key is \n" + this.DumpKey());
//             console.log( TAG, "\nThe Sbox is \n" + this.DumpTwoByTwo(this.Sbox));
//             console.log( TAG, "\nThe w array is \n" + this.DumpTwoByTwo(this.w));
//             console.log( TAG, "\nThe State array is \n" + this.DumpTwoByTwo(this.State));
//         }

//         public  DumpKey():string
//         {
//             let str : string = "";
//             for (let i = 0; i < this.key.length; i++)
//             {
//                 str = str + this.key[i].toString(16) + " ";
//             }
//             return str;
//         }

//         public DumpTwoByTwo( a : Buffer) : string
//         {
//             let str : string = "";
//             for (let i = 0; i < a.GetLength(0); i++)
//             {
//                 object obj2 = str;
//                 str = string.Concat(new object[] { obj2, "[", i, "] " });
//                 for (let j : int = 0; j < a.GetLength(1); j++)
//                 {
//                     str = str + a[i, j].toString(16) + " ";
//                 }
//                 str = str + "\n";
//             }
//             return str;
//         }

//         public  encrypt(input : Buffer, output : Buffer)
//         {
//             const dst: Buffer = Buffer.alloc(0x10);
//             const buffer2: Buffer = Buffer.alloc(0x10);

//             const inputBuffer = Buffer.from(input);
//             const outputBuffer = Buffer.from(output);

//             for (let i = 0; i < input.length; i += 0x10) {
//                 inputBuffer.copy(dst, 0, i, i + 0x10);
//                 const outPutArray = Array.from( buffer2);
//                 this.Cipher(Array.from(dst) ,Array.from( buffer2));
//                 buffer2.copy(output, 0, i, i + 0x10);
//             }
//         }

//         private static byte gfmultby01(byte b)
//         {
//             return b;
//         }

//         private static byte gfmultby02(byte b)
//         {
//             if (b < 0x80)
//             {
//                 return 0xff &  (b << 1);
//             }
//             return 0xff &  ((b << 1) ^ 0x1b);
//         }

//         private static byte gfmultby03(byte b)
//         {
//             return 0xff &  (gfmultby02(b) ^ b);
//         }

//         private static byte gfmultby09(byte b)
//         {
//             return 0xff &  (gfmultby02(gfmultby02(gfmultby02(b))) ^ b);
//         }

//         private static byte gfmultby0b(byte b)
//         {
//             return 0xff &  ((gfmultby02(gfmultby02(gfmultby02(b))) ^ gfmultby02(b)) ^ b);
//         }

//         private static byte gfmultby0d(byte b)
//         {
//             return 0xff &  ((gfmultby02(gfmultby02(gfmultby02(b))) ^ gfmultby02(gfmultby02(b))) ^ b);
//         }

//         private static byte gfmultby0e(byte b)
//         {
//             return 0xff &  ((gfmultby02(gfmultby02(gfmultby02(b))) ^ gfmultby02(gfmultby02(b))) ^ gfmultby02(b));
//         }

//         public void InvCipher(Buffer input, ref Buffer output)
//         {
//             this.State = Buffer.alloc(4, this.Nb];
//             for (let i = 0; i < (4 * this.Nb); i++)
//             {
//                 this.State[i % 4, i / 4] = input[i];
//             }
//             this.AddRoundKey(this.Nr);
//             for (let j :int = this.Nr - 1; j >= 1; j--)
//             {
//                 this.InvShiftRows();
//                 this.InvSubBytes();
//                 this.AddRoundKey(j);
//                 this.InvMixColumns();
//             }
//             this.InvShiftRows();
//             this.InvSubBytes();
//             this.AddRoundKey(0);
//             for (let k :int = 0; k < (4 * this.Nb); k++)
//             {
//                 output[k] = this.State[k % 4, k / 4];
//             }
//         }

//         private void InvMixColumns()
//         {
//             byte[,] buffer = Buffer.alloc(4, 4];
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let k :int = 0; k < 4; k++)
//                 {
//                     buffer[i, k] = this.State[i, k];
//                 }
//             }
//             for (let j : int = 0; j < 4; j++)
//             {
//                 this.State[0, j] = 0xff &  (((gfmultby0e(buffer[0, j]) ^ gfmultby0b(buffer[1, j])) ^ gfmultby0d(buffer[2, j])) ^ gfmultby09(buffer[3, j]));
//                 this.State[1, j] = 0xff &  (((gfmultby09(buffer[0, j]) ^ gfmultby0e(buffer[1, j])) ^ gfmultby0b(buffer[2, j])) ^ gfmultby0d(buffer[3, j]));
//                 this.State[2, j] = 0xff &  (((gfmultby0d(buffer[0, j]) ^ gfmultby09(buffer[1, j])) ^ gfmultby0e(buffer[2, j])) ^ gfmultby0b(buffer[3, j]));
//                 this.State[3, j] = 0xff &  (((gfmultby0b(buffer[0, j]) ^ gfmultby0d(buffer[1, j])) ^ gfmultby09(buffer[2, j])) ^ gfmultby0e(buffer[3, j]));
//             }
//         }

//         private void InvShiftRows()
//         {
//             byte[,] buffer = Buffer.alloc(4, 4];
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let k :int = 0; k < 4; k++)
//                 {
//                     buffer[i, k] = this.State[i, k];
//                 }
//             }
//             for (let j :int = 1; j < 4; j++)
//             {
//                 for (int m = 0; m < 4; m++)
//                 {
//                     this.State[j, (m + j) % this.Nb] = buffer[j, m];
//                 }
//             }
//         }

//         private void InvSubBytes()
//         {
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let j : int = 0; j < 4; j++)
//                 {
//                     this.State[i, j] = this.iSbox[this.State[i, j] >> 4, this.State[i, j] & 15];
//                 }
//             }
//         }

//         private void KeyExpansion()
//         {
//             this.w = Buffer.alloc(this.Nb * (this.Nr + 1), 4];
//             for (let i = 0; i < this.Nk; i++)
//             {
//                 this.w[i, 0] = this.key[4 * i];
//                 this.w[i, 1] = this.key[(4 * i) + 1];
//                 this.w[i, 2] = this.key[(4 * i) + 2];
//                 this.w[i, 3] = this.key[(4 * i) + 3];
//             }
//             Buffer word = Buffer.alloc(4];
//             for (let j :int = this.Nk; j < (this.Nb * (this.Nr + 1)); j++)
//             {
//                 word[0] = this.w[j - 1, 0];
//                 word[1] = this.w[j - 1, 1];
//                 word[2] = this.w[j - 1, 2];
//                 word[3] = this.w[j - 1, 3];
//                 if ((j % this.Nk) == 0)
//                 {
//                     word = this.SubWord(this.RotWord(word));
//                     word[0] = 0xff &  (word[0] ^ this.Rcon[j / this.Nk, 0]);
//                     word[1] = 0xff &  (word[1] ^ this.Rcon[j / this.Nk, 1]);
//                     word[2] = 0xff &  (word[2] ^ this.Rcon[j / this.Nk, 2]);
//                     word[3] = 0xff &  (word[3] ^ this.Rcon[j / this.Nk, 3]);
//                 }
//                 else if ((this.Nk > 6) && ((j % this.Nk) == 4))
//                 {
//                     word = this.SubWord(word);
//                 }
//                 this.w[j, 0] = 0xff &  (this.w[j - this.Nk, 0] ^ word[0]);
//                 this.w[j, 1] = 0xff &  (this.w[j - this.Nk, 1] ^ word[1]);
//                 this.w[j, 2] = 0xff &  (this.w[j - this.Nk, 2] ^ word[2]);
//                 this.w[j, 3] = 0xff &  (this.w[j - this.Nk, 3] ^ word[3]);
//             }
//         }

//         private void MixColumns()
//         {
//             byte[,] buffer = Buffer.alloc(4, 4];
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let k :int = 0; k < 4; k++)
//                 {
//                     buffer[i, k] = this.State[i, k];
//                 }
//             }
//             for (let j : int = 0; j < 4; j++)
//             {
//                 this.State[0, j] = 0xff &  (((gfmultby02(buffer[0, j]) ^ gfmultby03(buffer[1, j])) ^ gfmultby01(buffer[2, j])) ^ gfmultby01(buffer[3, j]));
//                 this.State[1, j] = 0xff &  (((gfmultby01(buffer[0, j]) ^ gfmultby02(buffer[1, j])) ^ gfmultby03(buffer[2, j])) ^ gfmultby01(buffer[3, j]));
//                 this.State[2, j] = 0xff &  (((gfmultby01(buffer[0, j]) ^ gfmultby01(buffer[1, j])) ^ gfmultby02(buffer[2, j])) ^ gfmultby03(buffer[3, j]));
//                 this.State[3, j] = 0xff &  (((gfmultby03(buffer[0, j]) ^ gfmultby01(buffer[1, j])) ^ gfmultby01(buffer[2, j])) ^ gfmultby02(buffer[3, j]));
//             }
//         }

//         public void resize2AES128(ref Buffer sendbytes)
//         {
//             let num :int =  sendbytes.length % 0x10;
//             if (num == 0)
//             {
//             }
//         }

//         private Buffer RotWord(Buffer word)
//         {
//             return [ word[1], word[2], word[3], word[0] };
//         }

//         private void SetNbNkNr(keySize: KeySize)
//         {
//             this.Nb = 4;
//             if (keySize == KeySize.Bits128)
//             {
//                 this.Nk = 4;
//                 this.Nr = 10;
//             }
//             else if (keySize == KeySize.Bits192)
//             {
//                 this.Nk = 6;
//                 this.Nr = 12;
//             }
//             else if (keySize == KeySize.Bits256)
//             {
//                 this.Nk = 8;
//                 this.Nr = 14;
//             }
//         }

//         private void ShiftRows()
//         {
//             byte[,] buffer = Buffer.alloc(4, 4];
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let k :int = 0; k < 4; k++)
//                 {
//                     buffer[i, k] = this.State[i, k];
//                 }
//             }
//             for (let j :int = 1; j < 4; j++)
//             {
//                 for (int m = 0; m < 4; m++)
//                 {
//                     this.State[j, m] = buffer[j, (m + j) % this.Nb];
//                 }
//             }
//         }

//         private void SubBytes()
//         {
//             for (let i = 0; i < 4; i++)
//             {
//                 for (let j : int = 0; j < 4; j++)
//                 {
//                     this.State[i, j] = this.Sbox[this.State[i, j] >> 4, this.State[i, j] & 15];
//                 }
//             }
//         }

//         private Buffer SubWord(Buffer word)
//         {
//             return [ this.Sbox[word[0] >> 4, word[0] & 15], this.Sbox[word[1] >> 4, word[1] & 15], this.Sbox[word[2] >> 4, word[2] & 15], this.Sbox[word[3] >> 4, word[3] & 15] };
//         }

//     }
