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

    _findPattern(pattern: ReadonlyArray<number>, offset: number, isWhite: boolean = false, tryHarder: boolean = false): BarcodeInfo | null {
        let counter = [];
        let counterPos = 0;
        let bestMatch = {
            error: Number.MAX_VALUE,
            code: -1,
            start: 0,
            end: 0,
        };
        let sum = 0;
        let error = 0;
        let epsilon = this.AVG_CODE_ERROR;

        if (!offset) {
            offset = this._nextSet(this._row);
        }

        for (let i = 0; i < pattern.length; i++) {
            counter[i] = 0;
        }

        for (let i = offset; i < this._row.length; i++) {
            if (this._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    sum = 0;
                    for (let j = 0; j < counter.length; j++) {
                        sum += counter[j];
                    }
                    error = this._matchPattern(counter, pattern);
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
    }

    _findStart() {
        let startInfo = null;
        let offset = this._nextSet(this._row);
        let narrowBarWidth = 1;
        let leadingWhitespaceStart = 0;

        while (!startInfo) {
            startInfo = this._findPattern(START_PATTERN, offset, false, true);
            if (!startInfo) {
                return null;
            }
            narrowBarWidth = Math.floor((startInfo.end - startInfo.start) / START_PATTERN_LENGTH);
            leadingWhitespaceStart = startInfo.start - narrowBarWidth * 5;
            if (leadingWhitespaceStart >= 0) {
                if (this._matchRange(leadingWhitespaceStart, startInfo.start, 0)) {
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
        // TODO: reverse, followed by some calcs, followed by another reverse? really?
        this._row.reverse();
        const offset = this._nextSet(this._row);
        const endInfo = this._findPattern(STOP_PATTERN, offset, false, true);
        this._row.reverse();

        if (endInfo === null) {
            return null;
        }

        // reverse numbers
        const tmp = endInfo.start;
        endInfo.start = this._row.length - endInfo.end;
        endInfo.end = this._row.length - tmp;

        return endInfo !== null ? this._verifyTrailingWhitespace(endInfo) : null;
    }

    _verifyCounterLength(counters: Array<number>) {
        return (counters.length % 10 === 0);
    };

    _decodeCode(counter: ReadonlyArray<number>) {
        const epsilon = this.AVG_CODE_ERROR;
        const bestMatch = {
                error: Number.MAX_VALUE,
                code: -1,
                start: 0,
                end: 0,
            };

        for (let code = 0; code < CODE_PATTERN.length; code++) {
            const error = this._matchPattern(counter, CODE_PATTERN[code]);
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
        let pos = 0;
        const counterLength = counters.length;
        const counter = [0, 0, 0, 0, 0];
        let code: BarcodeInfo | null = null;

        while (pos < counterLength) {
            for (let i = 0; i < 5; i++) {
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
        const startInfo = this._findStart();
        if (!startInfo) {
            return null;
        }

        const endInfo = this._findEnd();
        if (!endInfo) {
            return null;
        }

        const counters = this._fillCounters(startInfo.end, endInfo.start, false);
        if (!this._verifyCounterLength(counters)) {
            return null;
        }
        let decodedCodes = [];
        decodedCodes.push(startInfo);

        let result: Array<string> = [];
        const code = this._decodePayload(counters, result, decodedCodes);
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
