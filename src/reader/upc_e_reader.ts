import EANReader from './ean_reader';
import { BarcodeInfo, BarcodePosition } from './barcode_reader';

class UPCEReader extends EANReader {
    CODE_FREQUENCY_UPC = [
            [56, 52, 50, 49, 44, 38, 35, 42, 41, 37],
            [7, 11, 13, 14, 19, 25, 28, 21, 22, 26]];
    STOP_PATTERN = [1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7, 1 / 6 * 7];
    FORMAT = 'upc_e';

    _decodePayload(code: BarcodeInfo | null, result: Array<number>, decodedCodes: Array<BarcodeInfo | BarcodePosition>): BarcodeInfo | null {
        if (!code) return null;
        var i,
            self = this,
            codeFrequency = 0x0;

        for ( i = 0; i < 6; i++) {
            code = self._decodeCode(code.end);
            if (!code) {
                return null;
            }
            if (code.code >= self.CODE_G_START) {
                code.code = code.code - self.CODE_G_START;
                codeFrequency |= 1 << (5 - i);
            }
            result.push(code.code);
            decodedCodes.push(code);
        }
        if (!self._determineParity(codeFrequency, result)) {
            return null;
        }

        return code;
    };

    _determineParity(codeFrequency: number, result: Array<number>) {
        var i,
            nrSystem;

        for (nrSystem = 0; nrSystem < this.CODE_FREQUENCY_UPC.length; nrSystem++){
            for ( i = 0; i < this.CODE_FREQUENCY_UPC[nrSystem].length; i++) {
                if (codeFrequency === this.CODE_FREQUENCY_UPC[nrSystem][i]) {
                    result.unshift(nrSystem);
                    result.push(i);
                    return true;
                }
            }
        }
        return false;
    };

    _convertToUPCA(result: Array<number>) {
        var upca = [result[0]],
            lastDigit = result[result.length - 2];

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

    _checksum(result: Array<number>) {
        return super._checksum(this._convertToUPCA(result));
    };

    _findEnd(offset: number, isWhite: boolean) {
        isWhite = true; // TODO: hmmm... ?
        return super._findEnd(offset, isWhite);
    };

    _verifyTrailingWhitespace(endInfo: BarcodePosition) {
        var self = this,
            trailingWhitespaceEnd;

        trailingWhitespaceEnd = endInfo.end + ((endInfo.end - endInfo.start) / 2);
        if (trailingWhitespaceEnd < self._row.length) {
            if (self._matchRange(endInfo.end, trailingWhitespaceEnd, 0)) {
                return endInfo;
            }
        }
        return null;
    };
}

export default UPCEReader;
