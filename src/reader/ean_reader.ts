import BarcodeReader, { BarcodeReaderConfig, BarcodeInfo, BarcodePosition, Barcode } from './barcode_reader';
import {merge} from 'lodash';

class EANReader extends BarcodeReader {
    static CONFIG_KEYS = {
        supplements: {
            'type': 'arrayOf(string)',
            'default': [],
            'description': 'Allowed extensions to be decoded (2 and/or 5)',
        },
    };
    CODE_L_START = 0;
    CODE_G_START = 10;
    START_PATTERN = [1, 1, 1];
    STOP_PATTERN = [1, 1, 1];
    MIDDLE_PATTERN = [1, 1, 1, 1, 1];
    EXTENSION_START_PATTERN = [1, 1, 2];
    CODE_PATTERN = [
            [3, 2, 1, 1],
            [2, 2, 2, 1],
            [2, 1, 2, 2],
            [1, 4, 1, 1],
            [1, 1, 3, 2],
            [1, 2, 3, 1],
            [1, 1, 1, 4],
            [1, 3, 1, 2],
            [1, 2, 1, 3],
            [3, 1, 1, 2],
            [1, 1, 2, 3],
            [1, 2, 2, 2],
            [2, 2, 1, 2],
            [1, 1, 4, 1],
            [2, 3, 1, 1],
            [1, 3, 2, 1],
            [4, 1, 1, 1],
            [2, 1, 3, 1],
            [3, 1, 2, 1],
            [2, 1, 1, 3],
        ];
    CODE_FREQUENCY = [0, 11, 13, 14, 19, 25, 28, 21, 22, 26];
    SINGLE_CODE_ERROR = 0.70;
    AVG_CODE_ERROR = 0.48;
    FORMAT = 'ean_13';

    constructor(opts?: BarcodeReaderConfig, supplements?: Array<BarcodeReader>) {
        super(merge({ supplements: [] }, opts), supplements);
    }

    _decodeCode(start: number, coderange?: number): BarcodeInfo | null {
        var counter = [0, 0, 0, 0],
            i,
            self = this,
            offset = start,
            isWhite = !self._row[offset],
            counterPos = 0,
            bestMatch = {
                error: Number.MAX_VALUE,
                code: -1,
                start: start,
                end: start,
            },
            code,
            error;

        if (!coderange) {
            coderange = self.CODE_PATTERN.length;
        }

        for ( i = offset; i < self._row.length; i++) {
            if (self._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    for (code = 0; code < coderange; code++) {
                        error = self._matchPattern(counter, self.CODE_PATTERN[code]);
                        if (error < bestMatch.error) {
                            bestMatch.code = code;
                            bestMatch.error = error;
                        }
                    }
                    bestMatch.end = i;
                    if (bestMatch.error > self.AVG_CODE_ERROR) {
                        return null;
                    }
                    return bestMatch;
                } else {
                    counterPos++;
                }
                counter[counterPos] = 1;
                isWhite = !isWhite;
            }
        }
        return null;
    };

    _findPattern(pattern: ReadonlyArray<number>, offset: number, isWhite: boolean = false, tryHarder: boolean = false, epsilon?: number): BarcodePosition | null {
        var counter = [],
            self = this,
            i,
            counterPos = 0,
            bestMatch = {
                error: Number.MAX_VALUE,
                code: -1,
                start: 0,
                end: 0,
            },
            error,
            j,
            sum;

        if (!offset) {
            offset = self._nextSet(self._row);
        }

        if (isWhite === undefined) {
            isWhite = false;
        }

        if (tryHarder === undefined) {
            tryHarder = true;
        }

        if ( epsilon === undefined) {
            epsilon = self.AVG_CODE_ERROR;
        }

        for ( i = 0; i < pattern.length; i++) {
            counter[i] = 0;
        }

        for ( i = offset; i < self._row.length; i++) {
            if (self._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    sum = 0;
                    for ( j = 0; j < counter.length; j++) {
                        sum += counter[j];
                    }
                    error = self._matchPattern(counter, pattern);

                    if (error < epsilon) {
                        bestMatch.error = error;
                        bestMatch.start = i - sum;
                        bestMatch.end = i;
                        return bestMatch;
                    }
                    if (tryHarder) {
                        for ( j = 0; j < counter.length - 2; j++) {
                            counter[j] = counter[j + 2];
                        }
                        counter[counter.length - 2] = 0;
                        counter[counter.length - 1] = 0;
                        counterPos--;
                    } else {
                        return null;
                    }
                } else {
                    counterPos++;
                }
                counter[counterPos] = 1;
                isWhite = !isWhite;
            }
        }
        return null;
    };

    _findStart() {
        var self = this,
            leadingWhitespaceStart,
            offset = self._nextSet(self._row),
            startInfo;

        while (!startInfo) {
            startInfo = self._findPattern(self.START_PATTERN, offset);
            if (!startInfo) {
                return null;
            }
            leadingWhitespaceStart = startInfo.start - (startInfo.end - startInfo.start);
            if (leadingWhitespaceStart >= 0) {
                if (self._matchRange(leadingWhitespaceStart, startInfo.start, 0)) {
                    return startInfo;
                }
            }
            offset = startInfo.end;
            startInfo = null;
        }
        return null;
    };

    _verifyTrailingWhitespace(endInfo: BarcodePosition): BarcodePosition | null {
        var self = this,
            trailingWhitespaceEnd;

        trailingWhitespaceEnd = endInfo.end + (endInfo.end - endInfo.start);
        if (trailingWhitespaceEnd < self._row.length) {
            if (self._matchRange(endInfo.end, trailingWhitespaceEnd, 0)) {
                return endInfo;
            }
        }
        return null;
    };

    _findEnd(offset: number, isWhite: boolean): BarcodePosition | null {
        var self = this,
            endInfo = self._findPattern(self.STOP_PATTERN, offset, isWhite, false);

        return endInfo !== null ? self._verifyTrailingWhitespace(endInfo) : null;
    };

    _calculateFirstDigit(codeFrequency: number): number | null {
        var i,
            self = this;

        for ( i = 0; i < self.CODE_FREQUENCY.length; i++) {
            if (codeFrequency === self.CODE_FREQUENCY[i]) {
                return i;
            }
        }
        return null;
    };

    _decodePayload(code: BarcodeInfo | null, result: Array<number>, decodedCodes: Array<BarcodeInfo | BarcodePosition>): BarcodeInfo | null {
        var i,
            self = this,
            codeFrequency = 0x0,
            firstDigit;

        for ( i = 0; i < 6; i++) {
            if (code) {
                code = self._decodeCode(code.end);
            }
            if (!code) {
                return null;
            }
            if (code.code >= self.CODE_G_START) {
                code.code = code.code - self.CODE_G_START;
                codeFrequency |= 1 << (5 - i);
            } else {
                codeFrequency |= 0 << (5 - i);
            }
            result.push(code.code);
            decodedCodes.push(code);
        }

        firstDigit = self._calculateFirstDigit(codeFrequency);
        if (firstDigit === null) {
            return null;
        }
        result.unshift(firstDigit);

        const patternPosition = self._findPattern(self.MIDDLE_PATTERN, code!.end, true, false);
        if (patternPosition === null) {
            return null;
        }
        decodedCodes.push(patternPosition);

        for ( i = 0; i < 6; i++) {
            if (code?.end) {
                code = self._decodeCode(code.end, self.CODE_G_START);
            }
            if (!code) {
                return null;
            }
            decodedCodes.push(code);
            result.push(code.code);
        }

        return code;
    };

    _decode(row?: Array<number>, start?: BarcodePosition): Barcode | null {
        var startInfo,
            self = this,
            code: BarcodeInfo | BarcodePosition | null,
            result = new Array<number>(),
            decodedCodes = new Array<BarcodeInfo>(),
            resultInfo = {};

        startInfo = self._findStart();
        if (!startInfo) {
            return null;
        }
        code = {
            code: 0,
            start: startInfo.start,
            end: startInfo.end,
        };
        decodedCodes.push(code);
        code = self._decodePayload(code, result, decodedCodes);
        if (!code) {
            return null;
        }
        code = self._findEnd(code.end, false);
        if (!code){
            return null;
        }

        decodedCodes.push(code as BarcodeInfo);

        // Checksum
        if (!self._checksum(result)) {
            return null;
        }

        if (this.supplements.length > 0) {
            const ext = this._decodeExtensions(code.end);
            if (!ext || !ext.decodedCodes) {
                return null;
            }
            let lastCode = ext?.decodedCodes[ext?.decodedCodes?.length - 1] as BarcodeInfo,
                endInfo = {
                    start: lastCode.start + (((lastCode.end - lastCode.start) / 2) | 0),
                    end: lastCode.end,
                };
            if (!self._verifyTrailingWhitespace(endInfo)) {
                return null;
            }
            resultInfo = {
                supplement: ext,
                code: result.join('') + ext.code,
            };
        }

        return {
            code: result.join(''),
            start: startInfo.start,
            end: code.end,
            codeset: undefined,
            startInfo: startInfo,
            decodedCodes: decodedCodes,
            ...resultInfo,
            format: this.FORMAT,
        };
    };

    _decodeExtensions(offset: number): Barcode | null {
        var i,
            start = this._nextSet(this._row, offset),
            startInfo = this._findPattern(this.EXTENSION_START_PATTERN, start, false, false),
            result;

        if (startInfo === null) {
            return null;
        }

        for (i = 0; i < this.supplements.length; i++) {
            result = this.supplements[i]._decode(this._row, startInfo.end);
            if (result !== null) {
                return {
                    code: result.code,
                    start,
                    startInfo,
                    end: result.end,
                    codeset: undefined,
                    format: this.FORMAT,
                    decodedCodes: result.decodedCodes,
                };
            }
        }
        return null;
    };

    _checksum(result: Array<number>) {
        var sum = 0, i;

        for ( i = result.length - 2; i >= 0; i -= 2) {
            sum += result[i];
        }
        sum *= 3;
        for ( i = result.length - 1; i >= 0; i -= 2) {
            sum += result[i];
        }
        return sum % 10 === 0;
    };
}

export default EANReader;
