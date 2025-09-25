import { Buffer } from "buffer";
import BleManager from "react-native-ble-manager";

// ---------------------------
// BLE Config
// ---------------------------
const DEVICE_ADDRESS = "48:87:2D:77:CD:B2"; // MAC hoặc UUID của DX-BT24
const CHAR_WRITE_UUID = "0000FFE1-0000-1000-8000-00805f9b34fb"; // Notify/Write Characteristic
const START_BYTE = 0xaa;

// Commands
const FOTA_CMD_START_UPDATE = 0x10;
const FOTA_CMD_RECV_FW = 0x11;
const FOTA_CMD_CHECK_CRC_FW = 0x12;
const FOTA_CMD_UPDATE_METADATA = 0x13;

// MCU Response Codes
const FOTA_RESP: Record<number, string> = {
  0: "SUCCESS",
  1: "UNKNOWN_CMD",
  2: "UNEXPECTED_CMD",
  3: "ERR_CRC",
  4: "NEW_FW_TOO_LARGE",
  5: "WRITE_FW_ERR",
  6: "ERASE_ERR",
  7: "INDEX_OUT_OF_RANGE",
};

// ---------------------------
// CRC16 Modbus
// ---------------------------
function crc16_modbus(data: Uint8Array): number {
  let crc = 0xffff;
  for (let b of data) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x0001) {
        crc >>= 1;
        crc ^= 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}
function make_crc32_table(poly = 0x04c11db7): number[] {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let crc = i << 24;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x80000000) {
        crc = ((crc << 1) ^ poly) & 0xffffffff;
      } else {
        crc = (crc << 1) & 0xffffffff;
      }
    }
    table.push(crc >>> 0);
  }
  return table;
}

const CRC32_TABLE = make_crc32_table();

function crc32_stm32(data: Uint8Array): number {
  let crc = 0xffffffff;

  // pad lên bội số của 4
  let padded = data;
  if (data.length % 4 !== 0) {
    const pad = new Uint8Array(4 - (data.length % 4)).fill(0xff);
    padded = new Uint8Array([...data, ...pad]);
  }

  for (let i = 0; i < padded.length; i += 4) {
    const word =
      padded[i] |
      (padded[i + 1] << 8) |
      (padded[i + 2] << 16) |
      (padded[i + 3] << 24);

    for (let shift of [24, 16, 8, 0]) {
      const b = (word >> shift) & 0xff;
      crc =
        ((crc << 8) ^
          CRC32_TABLE[((crc >> 24) ^ b) & 0xff]) &
        0xffffffff;
    }
  }

  return crc >>> 0;
}

// ---------------------------
// Build FOTA frame
// ---------------------------
function build_frame_ctrl(cmd: number, payload: Uint8Array): Uint8Array {
  const header = Buffer.alloc(4);
  header.writeUInt8(START_BYTE, 0);
  header.writeUInt8(cmd, 1);
  header.writeUInt16LE(payload.length, 2);

  const frame = Buffer.concat([header, Buffer.from(payload)]);
  const crc = crc16_modbus(frame);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16LE(crc, 0);

  return new Uint8Array(Buffer.concat([frame, crcBuf]));
}

function build_frame_data(cmd: number, index: number, payload: Uint8Array): Uint8Array {
  const header = Buffer.alloc(6);
  header.writeUInt8(START_BYTE, 0);
  header.writeUInt8(cmd, 1);
  header.writeUInt16LE(index, 2);
  header.writeUInt16LE(payload.length, 4);

  const frame = Buffer.concat([header, Buffer.from(payload)]);
  const crc = crc16_modbus(frame);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16LE(crc, 0);

  return new Uint8Array(Buffer.concat([frame, crcBuf]));
}
export class FOTABleClient {
  private response: Uint8Array | null = null;

  async run_fota(binData: Uint8Array, blockSize = 128, pageSize = 2048) {
    console.log("🔌 Start FOTA...");
    const fw_size = binData.length;
    console.log(`[INFO] Firmware size: ${fw_size} bytes`);

    // Step 1: Start update
    const payload = Buffer.alloc(4);
    payload.writeUInt32LE(fw_size, 0);
    let frame = build_frame_ctrl(FOTA_CMD_START_UPDATE, new Uint8Array(payload));
    if (!(await this.send_and_wait_resp(frame))) return;

    // Step 2: Send firmware by block
    const total_pages = Math.ceil(fw_size / pageSize);
    let global_index = 0;

    for (let page = 0; page < total_pages; page++) {
      const page_start = page * pageSize;
      const page_end = Math.min(page_start + pageSize, fw_size);
      const page_data = binData.slice(page_start, page_end);

      for (let offset = 0; offset < page_data.length; offset += blockSize) {
        const block = page_data.slice(offset, offset + blockSize);
        frame = build_frame_data(FOTA_CMD_RECV_FW, global_index, block);
        console.log(`[SEND] PAGE=${page}, INDEX=${global_index}, LEN=${block.length}`);

        if (!(await this.send_and_wait_resp(frame, global_index, page))) return;

        global_index++;
        await new Promise((res) => setTimeout(res, 20));
      }
    }

    // Step 3: Send CRC32
    const fw_crc32 = crc32_stm32(binData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32LE(fw_crc32, 0);
    frame = build_frame_ctrl(FOTA_CMD_CHECK_CRC_FW, new Uint8Array(crcBuf));
    if (!(await this.send_and_wait_resp(frame))) return;

    // Step 4: Metadata
    const versionStr = Buffer.from("v1.0.0").toString("ascii");
    const versionBuf = Buffer.alloc(8, 0);
    versionBuf.write(versionStr);
    frame = build_frame_ctrl(FOTA_CMD_UPDATE_METADATA, new Uint8Array(versionBuf));
    if (!(await this.send_and_wait_resp(frame))) return;

    console.log("[INFO] ✅ FOTA Update Finished Successfully");
  }

  async send_and_wait_resp(frame: Uint8Array, index = 0, page = 0, timeout = 15000): Promise<boolean> {
    this.response = null;
    const cmd_sent = frame[1];
    const data: number[] = Array.from(frame);
    await BleManager.write(DEVICE_ADDRESS, CHAR_WRITE_UUID, data,256);
    console.log(`[SEND] CMD=0x${cmd_sent.toString(16).padStart(2, "0")}`);

    const start = Date.now();
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (this.response) {
          const data = this.response;
          this.response = null;
          clearInterval(interval);

          // parse response
          if (data[0] !== START_BYTE) {
            console.error("[ERR] Wrong start byte");
            resolve(false);
            return;
          }

          let resp_code = -1;
          if (cmd_sent === FOTA_CMD_RECV_FW) {
            if (data.length < 7) {
              console.error("[ERR] Response too short for RECV_FW");
              resolve(false);
              return;
            }
            const resp_index = data[2] | (data[3] << 8);
            const resp_page = data[4] | (data[5] << 8);
            resp_code = data[6];
            if (resp_index !== index || resp_page !== page) {
              console.error("[ERR] Index/Page mismatch");
              resolve(false);
              return;
            }
          } else {
            if (data.length < 3) {
              console.error("[ERR] Response too short");
              resolve(false);
              return;
            }
            resp_code = data[2];
          }

          console.log(`[MCU RESP] CMD=0x${cmd_sent.toString(16)} -> ${FOTA_RESP[resp_code] ?? "UNKNOWN"} (${resp_code})`);
          resolve(resp_code === 0);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          console.error("[ERR] No response from MCU (timeout)");
          resolve(false);
        }
      }, 50);
    });
  }

  notification_handler = (data: number[]) => {
    this.response = new Uint8Array(data);
  };
}
