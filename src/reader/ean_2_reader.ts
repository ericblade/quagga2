import EANReader, { CODE_G_START } from './ean_reader_new';
import { BarcodePosition, Barcode, BarcodeInfo } from './barcode_reader';


class EAN2Reader extends EANReader {
    FORMAT = 'ean_2';
    _decode(row?: Array<number>, start?: number): Barcode | null {
        console.warn('* EAN2Reader decode', row, start);
        if (row) {
            this._row = row;
        }
        var codeFrequency = 0,
            i = 0,
            offset = start,
            end = this._row.length,
            code,
            result = [],
            decodedCodes = [];

        if (offset === undefined){
            return null;
        }

        for (i = 0; i < 2 && offset < end; i++) {
            code = this._decodeCode(offset);
            console.warn('* decodeCode', i, code);
            if (!code) {
                return null;
            }
            decodedCodes.push(code);
            result.push(code.code % 10);
            if (code.code >= CODE_G_START) {
                codeFrequency |= 1 << (1 - i);
            }
            if (i !== 1) {
                offset = this._nextSet(this._row, code.end);
                offset = this._nextUnset(this._row, offset);
            }
        }

        console.warn('* int', result, parseInt(result.join('')) % 4, codeFrequency);
        if (result.length !== 2 || (parseInt(result.join('')) % 4) !== codeFrequency) {
            return null;
        }
        const startInfo = this._findStart();

        return {
            code: result.join(''),
            decodedCodes,
            end: (code as BarcodeInfo).end,
            format: this.FORMAT,
            startInfo: startInfo as BarcodePosition,
            start: (startInfo as BarcodePosition).start,
        };
    }
};

export default EAN2Reader;
