import EANReader, { CODE_G_START } from './ean_reader';
import { BarcodePosition, Barcode, BarcodeInfo } from './barcode_reader';


class EAN2Reader extends EANReader {
    FORMAT = 'ean_2';
    public decode(row?: Array<number>, start?: number): Barcode | null {
        if (row) {
            this._row = row;
        }

        let codeFrequency = 0;
        let offset = start;
        const end = this._row.length;
        const result = [];
        const decodedCodes = [];
        let code: BarcodeInfo | null = null;

        if (offset === undefined){
            return null;
        }

        for (let i = 0; i < 2 && offset < end; i++) {
            code = this._decodeCode(offset);
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
