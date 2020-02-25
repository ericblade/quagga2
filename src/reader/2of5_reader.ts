import BarcodeReader, { Barcode, BarcodeInfo } from './barcode_reader';

const N = 1;
const W = 3;
const START_PATTERN = [W, N, W, N, N, N];
const STOP_PATTERN = [W, N, N, N, W];
const CODE_PATTERN = [
    [N, N, W, W, N],
    [W, N, N, N, W],
    [N, W, N, N, W],
    [W, W, N, N, N],
    [N, N, W, N, W],
    [W, N, W, N, N],
    [N, W, W, N, N],
    [N, N, N, W, W],
    [W, N, N, W, N],
    [N, W, N, W, N],
];
const START_PATTERN_LENGTH = START_PATTERN.reduce((sum, val) => sum + val, 0);

class NewTwoOfFiveReader extends BarcodeReader {
    barSpaceRatio = [1, 1];
    FORMAT = '2of5';
    SINGLE_CODE_ERROR = 0.78;
    AVG_CODE_ERROR = 0.30;

    _findPattern(pattern: ReadonlyArray<number>, offset: number, isWhite: boolean, tryHarder: boolean): BarcodeInfo | null {
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
            sum,
            epsilon = self.AVG_CODE_ERROR;

        isWhite = isWhite || false;
        tryHarder = tryHarder || false;

        if (!offset) {
            offset = self._nextSet(self._row);
        }

        for (i = 0; i < pattern.length; i++) {
            counter[i] = 0;
        }

        for (i = offset; i < self._row.length; i++) {
            if (self._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    sum = 0;
                    for (j = 0; j < counter.length; j++) {
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
                        for (j = 0; j < counter.length - 2; j++) {
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

    }
    _findStart() {
        var self = this,
            leadingWhitespaceStart,
            offset = self._nextSet(self._row),
            startInfo = null,
            narrowBarWidth = 1;

        while (!startInfo) {
            startInfo = self._findPattern(START_PATTERN, offset, false, true);
            if (!startInfo) {
                return null;
            }
            narrowBarWidth = Math.floor((startInfo.end - startInfo.start) / START_PATTERN_LENGTH);
            leadingWhitespaceStart = startInfo.start - narrowBarWidth * 5;
            if (leadingWhitespaceStart >= 0) {
                if (self._matchRange(leadingWhitespaceStart, startInfo.start, 0)) {
                    return startInfo;
                }
            }
            offset = startInfo.end;
            startInfo = null;
        }
        return startInfo;
    }

    _verifyTrailingWhitespace(endInfo: BarcodeInfo) {
        let trailingWhitespaceEnd = endInfo.end + ((endInfo.end - endInfo.start) / 2);
        if (trailingWhitespaceEnd < this._row.length) {
            if (this._matchRange(endInfo.end, trailingWhitespaceEnd, 0)) {
                return endInfo;
            }
        }
        return null;
    }

    _findEnd() {
        var self = this,
            endInfo,
            tmp,
            offset;

        self._row.reverse();
        offset = self._nextSet(self._row);
        endInfo = self._findPattern(STOP_PATTERN, offset, false, true);
        self._row.reverse();

        if (endInfo === null) {
            return null;
        }

        // reverse numbers
        tmp = endInfo.start;
        endInfo.start = self._row.length - endInfo.end;
        endInfo.end = self._row.length - tmp;

        return endInfo !== null ? self._verifyTrailingWhitespace(endInfo) : null;
    }

    _verifyCounterLength(counters: Array<number>) {
        return (counters.length % 10 === 0);
    };

    _decodeCode(counter: ReadonlyArray<number>) {
        var error,
            epsilon = this.AVG_CODE_ERROR,
            code,
            bestMatch = {
                error: Number.MAX_VALUE,
                code: -1,
                start: 0,
                end: 0,
            };

        for (code = 0; code < CODE_PATTERN.length; code++) {
            error = this._matchPattern(counter, CODE_PATTERN[code]);
            if (error < bestMatch.error) {
                bestMatch.code = code;
                bestMatch.error = error;
            }
        }
        if (bestMatch.error < epsilon) {
            return bestMatch;
        }
        return null;
    };

    _decodePayload(counters: ReadonlyArray<number>, result: Array<string>, decodedCodes: Array<BarcodeInfo>) {
        var i,
            pos = 0,
            counterLength = counters.length,
            counter = [0, 0, 0, 0, 0],
            code;

        while (pos < counterLength) {
            for (i = 0; i < 5; i++) {
                counter[i] = counters[pos] * this.barSpaceRatio[0];
                pos += 2;
            }
            code = this._decodeCode(counter);
            if (!code) {
                return null;
            }
            result.push(code.code + '');
            decodedCodes.push(code);
        }
        return code;
    };


    _decode(row?: Array<number>, start?: number): Barcode | null {
        var startInfo,
            endInfo,
            code,
            result: Array<string> = [],
            decodedCodes = [],
            counters;

        startInfo = this._findStart();
        if (!startInfo) {
            return null;
        }
        decodedCodes.push(startInfo);

        endInfo = this._findEnd();
        if (!endInfo) {
            return null;
        }

        counters = this._fillCounters(startInfo.end, endInfo.start, false);
        if (!this._verifyCounterLength(counters)) {
            return null;
        }
        code = this._decodePayload(counters, result, decodedCodes);
        if (!code) {
            return null;
        }
        if (result.length < 5) {
            return null;
        }

        decodedCodes.push(endInfo);
        return {
            code: result.join(''),
            start: startInfo.start,
            end: endInfo.end,
            startInfo: startInfo,
            decodedCodes: decodedCodes,
            format: this.FORMAT,
        };

    }
}

export default NewTwoOfFiveReader;
