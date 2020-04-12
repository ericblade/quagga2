import EANReader, { CODE_G_START } from './ean_reader_new';
import { Barcode, BarcodePosition, BarcodeInfo } from './barcode_reader';

const CHECK_DIGIT_ENCODINGS = [24, 20, 18, 17, 12, 6, 3, 10, 9, 5];

class EAN5Reader extends EANReader {
    FORMAT = 'ean_5';
    _decode(row?: Array<number>, start?: number): Barcode | null {
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

        if (offset === undefined) {
            return null;
        }
        for (i = 0; i < 5 && offset < end; i++) {
            code = this._decodeCode(offset);
            if (!code) {
                return null;
            }
            decodedCodes.push(code);
            result.push(code.code % 10);
            if (code.code >= CODE_G_START) {
                codeFrequency |= 1 << (4 - i);
            }
            if (i !== 4) {
                offset = this._nextSet(this._row, code.end);
                offset = this._nextUnset(this._row, offset);
            }
        }

        if (result.length !== 5) {
            return null;
        }

        if (extensionChecksum(result) !== determineCheckDigit(codeFrequency)) {
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

function determineCheckDigit(codeFrequency: number) {
    var i;
    for (i = 0; i < 10; i++) {
        if (codeFrequency === CHECK_DIGIT_ENCODINGS[i]) {
            return i;
        }
    }
    return null;
}


function extensionChecksum(result: Array<number>) {
    var length = result.length,
        sum = 0,
        i;

    for (i = length - 2; i >= 0; i -= 2) {
        sum += result[i];
    }
    sum *= 3;
    for (i = length - 1; i >= 0; i -= 2) {
        sum += result[i];
    }
    sum *= 3;
    return sum % 10;
}

export default EAN5Reader;
