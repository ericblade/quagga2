import EANReader, { CODE_G_START } from './ean_reader';
import { BarcodePosition, BarcodeInfo } from './barcode_reader';

class UPCEReader extends EANReader {
    CODE_FREQUENCY = [
        [ 56, 52, 50, 49, 44, 38, 35, 42, 41, 37 ],
        [7, 11, 13, 14, 19, 25, 28, 21, 22, 26]];
    STOP_PATTERN = [1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7];
    FORMAT = 'upc_e';
    protected _decodePayload(inCode: BarcodePosition, result: Array<number>, decodedCodes: Array<BarcodePosition>): BarcodeInfo | null {
        let outCode: BarcodeInfo | BarcodePosition | null = { ...inCode };
        let codeFrequency = 0x0;

        for (let i = 0; i < 6; i++) {
            outCode = this._decodeCode(outCode.end);
            if (!outCode) {
                return null;
            }
            if ((outCode as BarcodeInfo).code >= CODE_G_START) {
                (outCode as BarcodeInfo).code = (outCode as BarcodeInfo).code - CODE_G_START;
                codeFrequency |= (1 << (5 - i));
            }
            result.push((outCode as BarcodeInfo).code);
            decodedCodes.push(outCode);
        }
        if (!this._determineParity(codeFrequency, result)) {
            return null;
        }
        return outCode as BarcodeInfo;
    };

    _determineParity(codeFrequency: number, result: Array<number>) {
        for (let nrSystem = 0; nrSystem < this.CODE_FREQUENCY.length; nrSystem++){
            for (let i = 0; i < this.CODE_FREQUENCY[nrSystem].length; i++) {
                if (codeFrequency === this.CODE_FREQUENCY[nrSystem][i]) {
                    result.unshift(nrSystem);
                    result.push(i);
                    return true;
                }
            }
        }
        return false;
    };

    _convertToUPCA(result: Array<number>) {
        let upca = [result[0]];
        const lastDigit = result[result.length - 2];

        if (lastDigit <= 2) {
            upca = upca.concat(result.slice(1, 3))
                .concat([lastDigit, 0, 0, 0, 0])
                .concat(result.slice(3, 6));
        } else if (lastDigit === 3) {
            upca = upca.concat(result.slice(1, 4))
                .concat([0, 0, 0, 0, 0])
                .concat(result.slice(4, 6));
        } else if (lastDigit === 4) {
            upca = upca.concat(result.slice(1, 5))
                .concat([0, 0, 0, 0, 0, result[5]]);
        } else {
            upca = upca.concat(result.slice(1, 6))
                .concat([0, 0, 0, 0, lastDigit]);
        }

        upca.push(result[result.length - 1]);
        return upca;
    };

    protected _checksum(result: Array<number>): boolean {
        return super._checksum(this._convertToUPCA(result));
    }

    protected _findEnd(offset: number, isWhite: boolean): BarcodePosition | null {
        return super._findEnd(offset, true);
    }

    protected _verifyTrailingWhitespace(endInfo: BarcodePosition): BarcodePosition | null {
        const trailingWhitespaceEnd = endInfo.end + ((endInfo.end - endInfo.start) / 2);
        if (trailingWhitespaceEnd < this._row.length) {
            if (this._matchRange(endInfo.end, trailingWhitespaceEnd, 0)) {
                return endInfo;
            }
        }
        return null;
    };
}

export default UPCEReader;
