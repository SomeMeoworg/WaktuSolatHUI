// Pure TypeScript QR Code Generator (Kazuhiko Arase)
// Self-contained, offline-ready, 0 dependencies.
// Supported Mode: 8-bit Byte Mode
// Error Correction: Level L (7% recovery)

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

class QRMath {
  static EXP_TABLE = new Uint8Array(256);
  static LOG_TABLE = new Uint8Array(256);

  static init() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      QRMath.EXP_TABLE[i] = x;
      QRMath.LOG_TABLE[x] = i;
      x <<= 1;
      if (x & 0x100) {
        x ^= 0x11d; // Generator polynomial for GF(2^8)
      }
    }
    QRMath.EXP_TABLE[255] = QRMath.EXP_TABLE[0];
  }

  static glog(n: number) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  }

  static gexp(n: number) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  }
}
QRMath.init();

class QRPolynomial {
  num: number[];

  constructor(num: number[], shift = 0) {
    const offset = (() => {
      let offset = 0;
      while (offset < num.length && num[offset] === 0) {
        offset++;
      }
      return offset;
    })();

    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
    for (let i = num.length - offset; i < this.num.length; i++) {
      this.num[i] = 0;
    }
  }

  get(index: number) {
    return this.num[index];
  }

  getLength() {
    return this.num.length;
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num);
  }

  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) {
      return this;
    }
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) {
      num[i] = this.get(i);
    }
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num).mod(e);
  }
}

class QRRSBlock {
  totalCount: number;
  dataCount: number;

  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }

  static getRSBlocks(version: number): QRRSBlock[] {
    // Standard Level L RS Blocks configuration for versions 1 to 10
    const RS_BLOCK_TABLE: { [v: number]: number[] } = {
      1: [26, 19],
      2: [44, 34],
      3: [70, 55],
      4: [100, 80],
      5: [134, 108],
      6: [172, 136],
      7: [196, 156],
      8: [242, 194],
      9: [292, 232],
      10: [346, 274],
    };

    const config = RS_BLOCK_TABLE[version] || RS_BLOCK_TABLE[10];
    return [new QRRSBlock(config[0], config[1])];
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  length = 0;

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }

  put(num: number, length: number) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    }
    this.length++;
  }
}

export class QRCode {
  version: number;
  errorCorrectionLevel = 'L';
  modules: (boolean | null)[][] = [];
  moduleCount = 0;
  dataList: Uint8Array;

  constructor(text: string) {
    const encoder = new TextEncoder();
    this.dataList = encoder.encode(text);

    // Auto version selection based on text length (L level capacity)
    const len = this.dataList.length;
    if (len <= 17) this.version = 1;
    else if (len <= 32) this.version = 2;
    else if (len <= 53) this.version = 3;
    else if (len <= 78) this.version = 4;
    else if (len <= 106) this.version = 5;
    else if (len <= 134) this.version = 6;
    else if (len <= 154) this.version = 7;
    else if (len <= 192) this.version = 8;
    else if (len <= 230) this.version = 9;
    else this.version = 10;

    this.make();
  }

  make() {
    this.moduleCount = this.version * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let i = 0; i < this.moduleCount; i++) {
      this.modules[i] = new Array(this.moduleCount).fill(null);
    }

    this.setupPositionDetectionPattern(0, 0);
    this.setupPositionDetectionPattern(this.moduleCount - 7, 0);
    this.setupPositionDetectionPattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(false, 0);

    const data = QRCode.createData(this.version, this.dataList);
    this.mapData(data, 0);
  }

  setupPositionDetectionPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = (r % 2 === 0);
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = (c % 2 === 0);
    }
  }

  setupPositionAdjustPattern() {
    const pos = QRCode.getAlignmentPatternPositions(this.version);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  setupTypeInfo(test: boolean, maskPattern: number) {
    const data = (1 << 3) | maskPattern; // Level L indicator + mask
    let bits = data << 10;
    while (QRCode.getBCHDigit(bits) - QRCode.getBCHDigit(0x537) >= 0) {
      bits ^= (0x537 << (QRCode.getBCHDigit(bits) - QRCode.getBCHDigit(0x537)));
    }
    const typeInfo = ((data << 10) | bits) ^ 0x5412;

    // Standard positioning of format info
    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((typeInfo >>> i) & 1) === 1);
      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }
    }

    for (let i = 0; i < 15; i++) {
      const mod = (!test && ((typeInfo >>> i) & 1) === 1);
      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod;
      } else {
        this.modules[8][15 - i - 1] = mod;
      }
    }

    this.modules[this.moduleCount - 8][8] = true;
  }

  mapData(data: Uint8Array, maskPattern: number) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;
          if (this.modules[row][currentCol] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
            }
            // Apply standard mask (row + col) % 2 === 0
            const mask = QRCode.getMask(maskPattern, row, currentCol);
            if (mask) {
              dark = !dark;
            }
            this.modules[row][currentCol] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  static getAlignmentPatternPositions(version: number): number[] {
    if (version === 1) return [];
    if (version === 2) return [6, 18];
    if (version === 3) return [6, 22];
    if (version === 4) return [6, 26];
    if (version === 5) return [6, 30];
    if (version === 6) return [6, 34];
    if (version === 7) return [6, 22, 38];
    if (version === 8) return [6, 24, 42];
    if (version === 9) return [6, 26, 46];
    return [6, 28, 50]; // v10
  }

  static getBCHDigit(data: number) {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  }

  static getMask(maskPattern: number, i: number, j: number): boolean {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return (i * j) % 2 + (i * j) % 3 === 0;
      case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
      case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
      default: return false;
    }
  }

  static createData(version: number, dataBytes: Uint8Array): Uint8Array {
    const rsBlocks = QRRSBlock.getRSBlocks(version);
    const buffer = new QRBitBuffer();

    // Mode indicator: 8-bit byte mode is 0100
    buffer.put(4, 4);
    // Character count indicator
    buffer.put(dataBytes.length, version < 10 ? 8 : 16);

    for (let i = 0; i < dataBytes.length; i++) {
      buffer.put(dataBytes[i], 8);
    }

    // Calc total capacity
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    // Add terminator (up to 4 zero bits)
    if (buffer.length + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    } else {
      buffer.put(0, totalDataCount * 8 - buffer.length);
    }

    // Padding to byte boundary
    while (buffer.length % 8 !== 0) {
      buffer.putBit(false);
    }

    // Padding bytes if not full
    while (true) {
      if (buffer.length >= totalDataCount * 8) {
        break;
      }
      buffer.put(0xec, 8);
      if (buffer.length >= totalDataCount * 8) {
        break;
      }
      buffer.put(0x11, 8);
    }

    return QRCode.createBytes(buffer, rsBlocks);
  }

  static createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]): Uint8Array {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;

    const dcdata: number[][] = new Array(rsBlocks.length);
    const ecdata: number[][] = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;

      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRCode.getErrorCorrectionPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);

      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }

    const data = new Uint8Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }

    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }

    return data;
  }

  static getErrorCorrectionPolynomial(eccCount: number): QRPolynomial {
    let a = new QRPolynomial([1]);
    for (let i = 0; i < eccCount; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)]));
    }
    return a;
  }

  getModules(): boolean[][] {
    const grid: boolean[][] = [];
    for (let r = 0; r < this.moduleCount; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < this.moduleCount; c++) {
        row.push(this.modules[r][c] || false);
      }
      grid.push(row);
    }
    return grid;
  }
}
