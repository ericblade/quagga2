import EANReader from './ean_reader';
import { BarcodeInfo, BarcodePosition, Barcode } from './barcode_reader';

class EAN2Reader extends EANReader {
    FORMAT = 'ean_2';
    _row = new Array<number>();
    _decode(row?: Array<number>, start?: BarcodePosition): Barcode | null {
        if (!row) {
            return null;
        }
        this._row = row;
        if (typeof start === 'number') {
            return null;
        }
        let offset = start ? start.start : 0;
        let end = this._row.length;
        const decodedCodes: Array<BarcodeInfo> = [];
        const result: Array<number> = [];
        let codeFrequency = 0;
        let code: BarcodeInfo | null = null;
        for (let i = 0; i < 2 && offset < end; i++) {
            code = this._decodeCode(offset) as BarcodeInfo;
            if (!code) {
                return null;
            }
            decodedCodes.push(code);
            result.push(code.code % 10);
            if (code.code >= this.CODE_G_START) {
                codeFrequency |= 1 << (1 - i);
            }
            if (i !== 1) {
                offset = this._nextSet(this._row, code.end);
                offset = this._nextUnset(this._row, offset);
            }
        }
        if (!code || result.length !== 2 || (parseInt(result.join(''), 10) % 4) !== codeFrequency) {
            return null;
        }
        return {
            code: result.join(''),
            decodedCodes,
            end: code.end,
            start: code.start,
            startInfo: start as BarcodePosition,
            format: this.FORMAT,
        };
    }
}

export default EAN2Reader;
