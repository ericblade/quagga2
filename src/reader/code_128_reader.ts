import BarcodeReader, { BarcodeCorrection, BarcodePosition, Barcode, BarcodeInfo } from './barcode_reader';

class Code128Reader extends BarcodeReader {
    CODE_SHIFT = 98;
    CODE_C = 99;
    CODE_B = 100;
    CODE_A = 101;
    START_CODE_A = 103;
    START_CODE_B = 104;
    START_CODE_C = 105;
    STOP_CODE = 106;
    CODE_PATTERN = [
            [2, 1, 2, 2, 2, 2],
            [2, 2, 2, 1, 2, 2],
            [2, 2, 2, 2, 2, 1],
            [1, 2, 1, 2, 2, 3],
            [1, 2, 1, 3, 2, 2],
            [1, 3, 1, 2, 2, 2],
            [1, 2, 2, 2, 1, 3],
            [1, 2, 2, 3, 1, 2],
            [1, 3, 2, 2, 1, 2],
            [2, 2, 1, 2, 1, 3],
            [2, 2, 1, 3, 1, 2],
            [2, 3, 1, 2, 1, 2],
            [1, 1, 2, 2, 3, 2],
            [1, 2, 2, 1, 3, 2],
            [1, 2, 2, 2, 3, 1],
            [1, 1, 3, 2, 2, 2],
            [1, 2, 3, 1, 2, 2],
            [1, 2, 3, 2, 2, 1],
            [2, 2, 3, 2, 1, 1],
            [2, 2, 1, 1, 3, 2],
            [2, 2, 1, 2, 3, 1],
            [2, 1, 3, 2, 1, 2],
            [2, 2, 3, 1, 1, 2],
            [3, 1, 2, 1, 3, 1],
            [3, 1, 1, 2, 2, 2],
            [3, 2, 1, 1, 2, 2],
            [3, 2, 1, 2, 2, 1],
            [3, 1, 2, 2, 1, 2],
            [3, 2, 2, 1, 1, 2],
            [3, 2, 2, 2, 1, 1],
            [2, 1, 2, 1, 2, 3],
            [2, 1, 2, 3, 2, 1],
            [2, 3, 2, 1, 2, 1],
            [1, 1, 1, 3, 2, 3],
            [1, 3, 1, 1, 2, 3],
            [1, 3, 1, 3, 2, 1],
            [1, 1, 2, 3, 1, 3],
            [1, 3, 2, 1, 1, 3],
            [1, 3, 2, 3, 1, 1],
            [2, 1, 1, 3, 1, 3],
            [2, 3, 1, 1, 1, 3],
            [2, 3, 1, 3, 1, 1],
            [1, 1, 2, 1, 3, 3],
            [1, 1, 2, 3, 3, 1],
            [1, 3, 2, 1, 3, 1],
            [1, 1, 3, 1, 2, 3],
            [1, 1, 3, 3, 2, 1],
            [1, 3, 3, 1, 2, 1],
            [3, 1, 3, 1, 2, 1],
            [2, 1, 1, 3, 3, 1],
            [2, 3, 1, 1, 3, 1],
            [2, 1, 3, 1, 1, 3],
            [2, 1, 3, 3, 1, 1],
            [2, 1, 3, 1, 3, 1],
            [3, 1, 1, 1, 2, 3],
            [3, 1, 1, 3, 2, 1],
            [3, 3, 1, 1, 2, 1],
            [3, 1, 2, 1, 1, 3],
            [3, 1, 2, 3, 1, 1],
            [3, 3, 2, 1, 1, 1],
            [3, 1, 4, 1, 1, 1],
            [2, 2, 1, 4, 1, 1],
            [4, 3, 1, 1, 1, 1],
            [1, 1, 1, 2, 2, 4],
            [1, 1, 1, 4, 2, 2],
            [1, 2, 1, 1, 2, 4],
            [1, 2, 1, 4, 2, 1],
            [1, 4, 1, 1, 2, 2],
            [1, 4, 1, 2, 2, 1],
            [1, 1, 2, 2, 1, 4],
            [1, 1, 2, 4, 1, 2],
            [1, 2, 2, 1, 1, 4],
            [1, 2, 2, 4, 1, 1],
            [1, 4, 2, 1, 1, 2],
            [1, 4, 2, 2, 1, 1],
            [2, 4, 1, 2, 1, 1],
            [2, 2, 1, 1, 1, 4],
            [4, 1, 3, 1, 1, 1],
            [2, 4, 1, 1, 1, 2],
            [1, 3, 4, 1, 1, 1],
            [1, 1, 1, 2, 4, 2],
            [1, 2, 1, 1, 4, 2],
            [1, 2, 1, 2, 4, 1],
            [1, 1, 4, 2, 1, 2],
            [1, 2, 4, 1, 1, 2],
            [1, 2, 4, 2, 1, 1],
            [4, 1, 1, 2, 1, 2],
            [4, 2, 1, 1, 1, 2],
            [4, 2, 1, 2, 1, 1],
            [2, 1, 2, 1, 4, 1],
            [2, 1, 4, 1, 2, 1],
            [4, 1, 2, 1, 2, 1],
            [1, 1, 1, 1, 4, 3],
            [1, 1, 1, 3, 4, 1],
            [1, 3, 1, 1, 4, 1],
            [1, 1, 4, 1, 1, 3],
            [1, 1, 4, 3, 1, 1],
            [4, 1, 1, 1, 1, 3],
            [4, 1, 1, 3, 1, 1],
            [1, 1, 3, 1, 4, 1],
            [1, 1, 4, 1, 3, 1],
            [3, 1, 1, 1, 4, 1],
            [4, 1, 1, 1, 3, 1],
            [2, 1, 1, 4, 1, 2],
            [2, 1, 1, 2, 1, 4],
            [2, 1, 1, 2, 3, 2],
            [2, 3, 3, 1, 1, 1, 2],
        ];
    SINGLE_CODE_ERROR = 0.64;
    AVG_CODE_ERROR = 0.30;
    FORMAT = 'code_128';
    MODULE_INDICES = { bar: [0, 2, 4], space: [1, 3, 5] };

    _decodeCode(start: number, correction?: BarcodeCorrection) {
        var counter = [0, 0, 0, 0, 0, 0],
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
                correction: {
                    bar: 1,
                    space: 1,
                },
            },
            code,
            error;

        for ( i = offset; i < self._row.length; i++) {
            if (self._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    if (correction) {
                        self._correct(counter, correction);
                    }
                    for (code = 0; code < self.CODE_PATTERN.length; code++) {
                        error = self._matchPattern(counter, self.CODE_PATTERN[code]);
                        if (error < bestMatch.error) {
                            bestMatch.code = code;
                            bestMatch.error = error;
                        }
                    }
                    bestMatch.end = i;
                    if (bestMatch.code === -1 || bestMatch.error > self.AVG_CODE_ERROR) {
                        return null;
                    }
                    if (self.CODE_PATTERN[bestMatch.code]) {
                        bestMatch.correction.bar = this.calculateCorrection(
                            self.CODE_PATTERN[bestMatch.code], counter,
                            this.MODULE_INDICES.bar);
                        bestMatch.correction.space = this.calculateCorrection(
                            self.CODE_PATTERN[bestMatch.code], counter,
                            this.MODULE_INDICES.space);
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

    _correct(counter: Array<number>, correction: BarcodeCorrection) {
        this._correctBars(counter, correction.bar, this.MODULE_INDICES.bar);
        this._correctBars(counter, correction.space, this.MODULE_INDICES.space);
    };

    _findStart() {
        var counter = [0, 0, 0, 0, 0, 0],
            i,
            self = this,
            offset = self._nextSet(self._row),
            isWhite = false,
            counterPos = 0,
            bestMatch = {
                error: Number.MAX_VALUE,
                code: -1,
                start: 0,
                end: 0,
                correction: {
                    bar: 1,
                    space: 1,
                },
            },
            code,
            error,
            j,
            sum;

        for ( i = offset; i < self._row.length; i++) {
            if (self._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    sum = 0;
                    for ( j = 0; j < counter.length; j++) {
                        sum += counter[j];
                    }
                    for (code = self.START_CODE_A; code <= self.START_CODE_C; code++) {
                        error = self._matchPattern(counter, self.CODE_PATTERN[code]);
                        if (error < bestMatch.error) {
                            bestMatch.code = code;
                            bestMatch.error = error;
                        }
                    }
                    if (bestMatch.error < self.AVG_CODE_ERROR) {
                        bestMatch.start = i - sum;
                        bestMatch.end = i;
                        bestMatch.correction.bar = this.calculateCorrection(
                            self.CODE_PATTERN[bestMatch.code], counter,
                            this.MODULE_INDICES.bar);
                        bestMatch.correction.space = this.calculateCorrection(
                            self.CODE_PATTERN[bestMatch.code], counter,
                            this.MODULE_INDICES.space);
                        return bestMatch;
                    }

                    for ( j = 0; j < 4; j++) {
                        counter[j] = counter[j + 2];
                    }
                    counter[4] = 0;
                    counter[5] = 0;
                    counterPos--;
                } else {
                    counterPos++;
                }
                counter[counterPos] = 1;
                isWhite = !isWhite;
            }
        }
        return null;
    };

    _decode(row?: Array<number>, start?: BarcodePosition): Barcode | null {
        const startInfo = this._findStart();
        if (startInfo === null) {
            return null;
        }
        var self = this,
            done = false,
            result = [],
            multiplier = 0,
            checksum = 0,
            codeset,
            rawResult = [],
            decodedCodes = [],
            shiftNext = false,
            unshift,
            removeLastCharacter = true;

        let code: BarcodeInfo | null = {
            code: startInfo.code,
            start: startInfo.start,
            end: startInfo.end,
            correction: {
                bar: startInfo.correction.bar,
                space: startInfo.correction.space,
            },
        };
        decodedCodes.push(code);
        checksum = code.code;
        switch (code.code) {
        case self.START_CODE_A:
            codeset = self.CODE_A;
            break;
        case self.START_CODE_B:
            codeset = self.CODE_B;
            break;
        case self.START_CODE_C:
            codeset = self.CODE_C;
            break;
        default:
            return null;
        }

        while (!done) {
            unshift = shiftNext;
            shiftNext = false;
            code = self._decodeCode(code!.end, code!.correction);
            if (code !== null) {
                if (code.code !== self.STOP_CODE) {
                    removeLastCharacter = true;
                }

                if (code.code !== self.STOP_CODE) {
                    rawResult.push(code.code);
                    multiplier++;
                    checksum += multiplier * code.code;
                }
                decodedCodes.push(code);

                switch (codeset) {
                case self.CODE_A:
                    if (code.code < 64) {
                        result.push(String.fromCharCode(32 + code.code));
                    } else if (code.code < 96) {
                        result.push(String.fromCharCode(code.code - 64));
                    } else {
                        if (code.code !== self.STOP_CODE) {
                            removeLastCharacter = false;
                        }
                        switch (code.code) {
                        case self.CODE_SHIFT:
                            shiftNext = true;
                            codeset = self.CODE_B;
                            break;
                        case self.CODE_B:
                            codeset = self.CODE_B;
                            break;
                        case self.CODE_C:
                            codeset = self.CODE_C;
                            break;
                        case self.STOP_CODE:
                            done = true;
                            break;
                        }
                    }
                    break;
                case self.CODE_B:
                    if (code.code < 96) {
                        result.push(String.fromCharCode(32 + code.code));
                    } else {
                        if (code.code !== self.STOP_CODE) {
                            removeLastCharacter = false;
                        }
                        switch (code.code) {
                        case self.CODE_SHIFT:
                            shiftNext = true;
                            codeset = self.CODE_A;
                            break;
                        case self.CODE_A:
                            codeset = self.CODE_A;
                            break;
                        case self.CODE_C:
                            codeset = self.CODE_C;
                            break;
                        case self.STOP_CODE:
                            done = true;
                            break;
                        }
                    }
                    break;
                case self.CODE_C:
                    if (code.code < 100) {
                        result.push(code.code < 10 ? '0' + code.code : code.code);
                    } else {
                        if (code.code !== self.STOP_CODE) {
                            removeLastCharacter = false;
                        }
                        switch (code.code) {
                        case self.CODE_A:
                            codeset = self.CODE_A;
                            break;
                        case self.CODE_B:
                            codeset = self.CODE_B;
                            break;
                        case self.STOP_CODE:
                            done = true;
                            break;
                        }
                    }
                    break;
                }
            } else {
                done = true;
            }
            if (unshift) {
                codeset = codeset === self.CODE_A ? self.CODE_B : self.CODE_A;
            }
        }

        if (code === null) {
            return null;
        }

        code.end = self._nextUnset(self._row, code.end);
        if (!self._verifyTrailingWhitespace(code)){
            return null;
        }

        checksum -= multiplier * rawResult[rawResult.length - 1];
        if (checksum % 103 !== rawResult[rawResult.length - 1]) {
            return null;
        }

        if (!result.length) {
            return null;
        }

        // remove last code from result (checksum)
        if (removeLastCharacter) {
            result.splice(result.length - 1, 1);
        }


        return {
            code: result.join(''),
            start: startInfo.start,
            end: code.end,
            codeset: codeset,
            startInfo: startInfo,
            decodedCodes: decodedCodes,
            endInfo: code,
            format: this.FORMAT,
        };
    };

    _verifyTrailingWhitespace(endInfo: BarcodeInfo): BarcodeInfo | null {

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


    calculateCorrection(expected: ReadonlyArray<number>, normalized: ReadonlyArray<number>, indices: ReadonlyArray<number>): number {
        var length = indices.length,
            sumNormalized = 0,
            sumExpected = 0;

        while (length--) {
            sumExpected += expected[indices[length]];
            sumNormalized += normalized[indices[length]];
        }
        return sumExpected / sumNormalized;
    }
}

export default Code128Reader;
