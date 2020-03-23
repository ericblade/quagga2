import EANReader from './ean_reader';
import { BarcodePosition, Barcode } from './barcode_reader';

const CHECK_DIGIT_ENCODINGS = [24, 20, 18, 17, 12, 6, 3, 10, 9, 5];

class EAN5Reader extends EANReader {
    FORMAT = 'ean_5';
    _row = new Array<number>();

    _decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null {
        if (!row) {
            return null;
        }
        this._row = row;
        var codeFrequency = 0,
            i = 0,
            offset = start,
            end = this._row.length,
            code,
            result = [],
            decodedCodes = [];

        if (typeof start !== 'number') {
            return null;
        }

        for (i = 0; i < 5 && offset! < end; i++) { // TODO: ugh
            code = this._decodeCode(offset as number);
            if (!code) {
                return null;
            }
            decodedCodes.push(code);
            result.push(code.code % 10);
            if (code.code >= this.CODE_G_START) {
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
        const startInfo = this._findStart() as BarcodePosition; // TODO: hack!
        const endInfo = this._findEnd(0, true) as BarcodePosition; // TODO: hack!
        return {
            code: result.join(''),
            decodedCodes,
            end: endInfo.end,
            start: startInfo.start,
            startInfo: startInfo,
            format: this.FORMAT,
        };
    };
}

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
