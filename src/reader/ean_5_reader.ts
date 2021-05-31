import EANReader, { CODE_G_START } from './ean_reader';
import { Barcode, BarcodePosition, BarcodeInfo } from './barcode_reader';

const CHECK_DIGIT_ENCODINGS = [24, 20, 18, 17, 12, 6, 3, 10, 9, 5];

function determineCheckDigit(codeFrequency: number) {
    for (let i = 0; i < 10; i++) {
        if (codeFrequency === CHECK_DIGIT_ENCODINGS[i]) {
            return i;
        }
    }
    return null;
}

function extensionChecksum(result: Array<number>) {
    const length = result.length;
    let sum = 0;

    for (let i = length - 2; i >= 0; i -= 2) {
        sum += result[i];
    }
    sum *= 3;
    for (let i = length - 1; i >= 0; i -= 2) {
        sum += result[i];
    }
    sum *= 3;
    return sum % 10;
}

class EAN5Reader extends EANReader {
    FORMAT = 'ean_5';
    public decode(row?: Array<number>, start?: number): Barcode | null {
        if (start === undefined) {
            return null;
        }

        if (row) {
            this._row = row;
        }

        let codeFrequency = 0;
        let offset = start;
        const end = this._row.length;
        let code: BarcodeInfo | null = null;
        const result = [];
        const decodedCodes = [];

        for (let i = 0; i < 5 && offset < end; i++) {
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

export default EAN5Reader;
