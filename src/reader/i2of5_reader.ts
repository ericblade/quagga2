// TODO: i2of5_reader and 2of5_reader share very similar code, make use of that

import BarcodeReader, { BarcodeReaderConfig, BarcodeInfo, BarcodePosition, Barcode } from './barcode_reader';
import merge from 'lodash/merge';

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
            const counterSum = [0, 0];
            const codeSum = [0, 0];
            const correction = [0, 0];
            const correctionRatio = this.MAX_CORRECTION_FACTOR;
            const correctionRatioInverse = 1 / correctionRatio;

            for (let i = 0; i < counter.length; i++) {
                counterSum[i % 2] += counter[i];
                codeSum[i % 2] += code[i];
            }
            correction[0] = codeSum[0] / counterSum[0];
            correction[1] = codeSum[1] / counterSum[1];

            correction[0] = Math.max(Math.min(correction[0], correctionRatio), correctionRatioInverse);
            correction[1] = Math.max(Math.min(correction[1], correctionRatio), correctionRatioInverse);
            this.barSpaceRatio = correction;
            for (let i = 0; i < counter.length; i++) {
                counter[i] *= this.barSpaceRatio[i % 2];
            }
        }
        return BarcodeReader.prototype._matchPattern.call(this, counter, code);
    };

    _findPattern(pattern: ReadonlyArray<number>, offset?: number, isWhite: boolean = false, tryHarder: boolean = false): BarcodeInfo | null {
        const counter = new Array<number>(pattern.length).fill(0);
        let counterPos = 0;
        const bestMatch = {
            error: Number.MAX_VALUE,
            code: -1,
            start: 0,
            end: 0,
        };

        const epsilon = this.AVG_CODE_ERROR;

        isWhite = isWhite || false;
        tryHarder = tryHarder || false;

        if (!offset) {
            offset = this._nextSet(this._row);
        }

        for (let i = offset; i < this._row.length; i++) {
            if (this._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    const sum = counter.reduce((prev, next) => prev + next, 0);
                    const error = this._matchPattern(counter, pattern);
                    if (error < epsilon) {
                        bestMatch.error = error;
                        bestMatch.start = i - sum;
                        bestMatch.end = i;
                        return bestMatch;
                    }
                    if (tryHarder) {
                        for (let j = 0; j < counter.length - 2; j++) {
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
        let leadingWhitespaceStart = 0;
        let offset = this._nextSet(this._row);
        let startInfo: BarcodePosition | null = null;
        let narrowBarWidth = 1;

        while (!startInfo) {
            startInfo = this._findPattern(this.START_PATTERN, offset, false, true);
            if (!startInfo) {
                return null;
            }
            narrowBarWidth = Math.floor((startInfo.end - startInfo.start) / 4);
            leadingWhitespaceStart = startInfo.start - narrowBarWidth * 10;
            if (leadingWhitespaceStart >= 0) {
                if (this._matchRange(leadingWhitespaceStart, startInfo.start, 0)) {
                    return startInfo;
                }
            }
            offset = startInfo.end;
            startInfo = null;
        }
        return null;
    };

    _verifyTrailingWhitespace(endInfo: BarcodePosition) {
        const trailingWhitespaceEnd = endInfo.end + ((endInfo.end - endInfo.start) / 2);
        if (trailingWhitespaceEnd < this._row.length) {
            if (this._matchRange(endInfo.end, trailingWhitespaceEnd, 0)) {
                return endInfo;
            }
        }
        return null;
    };

    _findEnd() {
        this._row.reverse();
        const endInfo = this._findPattern(this.STOP_PATTERN);
        this._row.reverse();

        if (endInfo === null) {
            return null;
        }

        // reverse numbers
        const tmp = endInfo.start;
        endInfo.start = this._row.length - endInfo.end;
        endInfo.end = this._row.length - tmp;

        return endInfo !== null ? this._verifyTrailingWhitespace(endInfo) : null;
    };

    _decodePair(counterPair: Array<Array<number>>) {
        const codes: Array<BarcodeInfo> = [];

        for (let i = 0; i < counterPair.length; i++) {
            const code = this._decodeCode(counterPair[i]);
            if (!code) {
                return null;
            }
            codes.push(code);
        }
        return codes;
    };

    _decodeCode(counter: Array<number>): BarcodeInfo | null {
        const epsilon = this.AVG_CODE_ERROR;

        const bestMatch = {
            error: Number.MAX_VALUE,
            code: -1,
            start: 0,
            end: 0,
        };

        for (let code = 0; code < this.CODE_PATTERN.length; code++) {
            const error = this._matchPattern(counter, this.CODE_PATTERN[code]);
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
        let pos = 0;
        const counterLength = counters.length;
        const counterPair = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
        let codes: BarcodeInfo[] | null = null;

        while (pos < counterLength) {
            for (let i = 0; i < 5; i++) {
                counterPair[0][i] = counters[pos] * this.barSpaceRatio[0];
                counterPair[1][i] = counters[pos + 1] * this.barSpaceRatio[1];
                pos += 2;
            }
            codes = this._decodePair(counterPair);
            if (!codes) {
                return null;
            }
            for (let i = 0; i < codes.length; i++) {
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
        var result = new Array<string>();
        var decodedCodes = new Array<BarcodePosition>();

        const startInfo = this._findStart();
        if (!startInfo) {
            return null;
        }
        decodedCodes.push(startInfo);

        const endInfo = this._findEnd();
        if (!endInfo) {
            return null;
        }

        const counters = this._fillCounters(startInfo.end, endInfo.start, false);
        if (!this._verifyCounterLength(counters)) {
            return null;
        }
        const code = this._decodePayload(counters, result, decodedCodes);
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
