import BarcodeReader, { BarcodeReaderConfig, BarcodeInfo, BarcodePosition, Barcode } from './barcode_reader';
import {merge} from 'lodash';

const N = 1;
const W = 3;

class I2of5Reader extends BarcodeReader {
    barSpaceRatio = [1, 1];
    SINGLE_CODE_ERROR = 0.78;
    AVG_CODE_ERROR = 0.38;

    START_PATTERN = [N, N, N, N];
    STOP_PATTERN = [N, N, W];
    CODE_PATTERN = [
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
    MAX_CORRECTION_FACTOR = 5;
    FORMAT = 'i2of5';

    constructor(opts: BarcodeReaderConfig) {
        super(merge({ normalizeBarSpaceWidth: false }, opts));
        if (opts.normalizeBarSpaceWidth) {
            this.SINGLE_CODE_ERROR = 0.38;
            this.AVG_CODE_ERROR = 0.09;
        }
        this.config = opts;
        return this;
    }

    _matchPattern(counter: Array<number>, code: ReadonlyArray<number>) {
        if (this.config.normalizeBarSpaceWidth) {
            var i,
                counterSum = [0, 0],
                codeSum = [0, 0],
                correction = [0, 0],
                correctionRatio = this.MAX_CORRECTION_FACTOR,
                correctionRatioInverse = 1 / correctionRatio;

            for (i = 0; i < counter.length; i++) {
                counterSum[i % 2] += counter[i];
                codeSum[i % 2] += code[i];
            }
            correction[0] = codeSum[0] / counterSum[0];
            correction[1] = codeSum[1] / counterSum[1];

            correction[0] = Math.max(Math.min(correction[0], correctionRatio), correctionRatioInverse);
            correction[1] = Math.max(Math.min(correction[1], correctionRatio), correctionRatioInverse);
            this.barSpaceRatio = correction;
            for (i = 0; i < counter.length; i++) {
                counter[i] *= this.barSpaceRatio[i % 2];
            }
        }
        return BarcodeReader.prototype._matchPattern.call(this, counter, code);
    };

    _findPattern(pattern: ReadonlyArray<number>, offset?: number, isWhite: boolean = false, tryHarder: boolean = false): BarcodeInfo | null {
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
    };

    _findStart() {
        var self = this,
            leadingWhitespaceStart,
            offset = self._nextSet(self._row),
            startInfo,
            narrowBarWidth = 1;

        while (!startInfo) {
            startInfo = self._findPattern(self.START_PATTERN, offset, false, true);
            if (!startInfo) {
                return null;
            }
            narrowBarWidth = Math.floor((startInfo.end - startInfo.start) / 4);
            leadingWhitespaceStart = startInfo.start - narrowBarWidth * 10;
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

    _findEnd() {
        var self = this,
            endInfo,
            tmp;

        self._row.reverse();
        endInfo = self._findPattern(self.STOP_PATTERN);
        self._row.reverse();

        if (endInfo === null) {
            return null;
        }

        // reverse numbers
        tmp = endInfo.start;
        endInfo.start = self._row.length - endInfo.end;
        endInfo.end = self._row.length - tmp;

        return endInfo !== null ? self._verifyTrailingWhitespace(endInfo) : null;
    };

    _decodePair(counterPair: Array<Array<number>>) {
        var i,
            code,
            codes = [],
            self = this;

        for (i = 0; i < counterPair.length; i++) {
            code = self._decodeCode(counterPair[i]);
            if (!code) {
                return null;
            }
            codes.push(code);
        }
        return codes;
    };

    _decodeCode(counter: Array<number>): BarcodeInfo | null {
        var self = this,
            error,
            epsilon = self.AVG_CODE_ERROR,
            code,
            bestMatch = {
                error: Number.MAX_VALUE,
                code: -1,
                start: 0,
                end: 0,
            };

        for (code = 0; code < self.CODE_PATTERN.length; code++) {
            error = self._matchPattern(counter, self.CODE_PATTERN[code]);
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

    _decodePayload(counters: ReadonlyArray<number>, result: Array<string>, decodedCodes: Array<BarcodeInfo | BarcodePosition>) {
        var i,
            self = this,
            pos = 0,
            counterLength = counters.length,
            counterPair = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
            codes;

        while (pos < counterLength) {
            for (i = 0; i < 5; i++) {
                counterPair[0][i] = counters[pos] * this.barSpaceRatio[0];
                counterPair[1][i] = counters[pos + 1] * this.barSpaceRatio[1];
                pos += 2;
            }
            codes = self._decodePair(counterPair);
            if (!codes) {
                return null;
            }
            for (i = 0; i < codes.length; i++) {
                result.push(codes[i].code + '');
                decodedCodes.push(codes[i]);
            }
        }
        return codes;
    };

    _verifyCounterLength(counters: Array<number>) {
        return (counters.length % 10 === 0);
    };

    _decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null {
        var startInfo,
            endInfo,
            self = this,
            code,
            result = new Array<string>(),
            decodedCodes = new Array<BarcodePosition>(),
            counters;

        startInfo = self._findStart();
        if (!startInfo) {
            return null;
        }
        decodedCodes.push(startInfo);

        endInfo = self._findEnd();
        if (!endInfo) {
            return null;
        }

        counters = self._fillCounters(startInfo.end, endInfo.start, false);
        if (!self._verifyCounterLength(counters)) {
            return null;
        }
        code = self._decodePayload(counters, result, decodedCodes);
        if (!code) {
            return null;
        }
        if (result.length % 2 !== 0 ||
                result.length < 6) {
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
    };
}

export default I2of5Reader;
