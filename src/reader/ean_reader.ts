import BarcodeReader, { BarcodeReaderConfig, BarcodeInfo, BarcodePosition, Barcode } from './barcode_reader';
import { merge } from 'lodash';

// const CODE_L_START = 0;
const CODE_G_START = 10;
export { CODE_G_START };
const START_PATTERN = [1, 1, 1];
const MIDDLE_PATTERN = [1, 1, 1, 1, 1];
export { MIDDLE_PATTERN };
const EXTENSION_START_PATTERN = [1, 1, 2];
const CODE_PATTERN = [
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
const CODE_FREQUENCY = [0, 11, 13, 14, 19, 25, 28, 21, 22, 26];
// const SINGLE_CODE_ERROR = 0.70;
const AVG_CODE_ERROR = 0.48;

class EANReader extends BarcodeReader {
    FORMAT = 'ean_13';
    SINGLE_CODE_ERROR = 0.70;
    STOP_PATTERN = [1, 1, 1]; // TODO: does this need to be in the class?

    constructor(config?: BarcodeReaderConfig, supplements?: Array<BarcodeReader>) {
        super(merge({ supplements: [] }, config), supplements);
    }
    _findPattern(pattern: ReadonlyArray<number>, offset: number, isWhite: boolean, tryHarder: boolean): BarcodePosition | null {
        const counter = new Array<number>(pattern.length).fill(0);
        const bestMatch: BarcodePosition = {
            error: Number.MAX_VALUE,
            start: 0,
            end: 0
        };
        const epsilon = AVG_CODE_ERROR;
        // console.warn('* findPattern', pattern, offset, isWhite, tryHarder, epsilon);
        let counterPos = 0;
        if (!offset) {
            offset = this._nextSet(this._row);
        }
        let found = false;
        for (let i = offset; i < this._row.length; i++) {
            // console.warn(`* loop i=${offset} len=${this._row.length} isWhite=${isWhite} counterPos=${counterPos}`);
            if (this._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos] += 1;
            } else {
                if (counterPos === counter.length - 1) {
                    const error = this._matchPattern(counter, pattern);
                    // console.warn('* matchPattern', error, counter, pattern);
                    if (error < epsilon && bestMatch.error && error < bestMatch.error) {
                        found = true;
                        bestMatch.error = error;
                        bestMatch.start = i - counter.reduce((sum, value) => sum + value, 0);
                        bestMatch.end = i;
                        // console.warn('* return bestMatch', JSON.stringify(bestMatch));
                        return bestMatch;
                    }
                    if (tryHarder) {
                        for (let j = 0; j < counter.length - 2; j++) {
                            counter[j] = counter[j + 2];
                        }
                        counter[counter.length - 2] = 0;
                        counter[counter.length - 1] = 0;
                        counterPos--;
                    }
                } else {
                    counterPos++;
                }
                counter[counterPos] = 1;
                isWhite = !isWhite;
            }
        }
        if (found) {
            // console.warn('* return bestMatch', JSON.stringify(bestMatch));
        } else {
            // console.warn('* return null');
        }
        return found ? bestMatch : null;
    }

    // TODO: findPattern and decodeCode appear to share quite similar code, can it be reduced?
    _decodeCode(start: number, coderange?: number): BarcodeInfo | null {
        // console.warn('* decodeCode', start, coderange);
        const counter = [0, 0, 0, 0];
        const offset = start;
        const bestMatch: BarcodeInfo = {
            error: Number.MAX_VALUE,
            code: -1,
            start: start,
            end: start
        };
        const epsilon = AVG_CODE_ERROR;
        let isWhite = !this._row[offset];
        let counterPos = 0;

        if (!coderange) {
            // console.warn('* decodeCode before length');
            coderange = CODE_PATTERN.length;
            // console.warn('* decodeCode after length');
        }

        let found = false;
        for (let i = offset; i < this._row.length; i++) {
            if (this._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    for (let code = 0; code < coderange; code++) {
                        const error = this._matchPattern(counter, CODE_PATTERN[code]);
                        bestMatch.end = i;
                        if (error < bestMatch.error!) {
                            bestMatch.code = code;
                            bestMatch.error = error;
                        }
                    }
                    if (bestMatch.error! > epsilon) {
                        // console.warn('* return null');
                        return null;
                    }
                    // console.warn('* return bestMatch', JSON.stringify(bestMatch));
                    return bestMatch;
                } else {
                    counterPos++;
                }
                counter[counterPos] = 1;
                isWhite = !isWhite;
            }
        }
        return found ? bestMatch : null;
    }

    protected _findStart(): BarcodePosition | null {
        // console.warn('* findStart');
        let offset = this._nextSet(this._row);
        let startInfo: BarcodePosition | null = null;

        while (!startInfo) {
            startInfo = this._findPattern(START_PATTERN, offset, false, true);
            // console.warn('* startInfo=', JSON.stringify(startInfo));
            if (!startInfo) {
                return null;
            }

            const leadingWhitespaceStart = startInfo.start - (startInfo.end - startInfo.start);

            if (leadingWhitespaceStart >= 0) {
                if (this._matchRange(leadingWhitespaceStart, startInfo.start, 0)) {
                    // console.warn('* returning startInfo');
                    return startInfo;
                }
            }

            offset = startInfo.end;
            startInfo = null;
        }
        // console.warn('* returning null');
        return null;
    }

    private _calculateFirstDigit(codeFrequency: number): number | null {
        // console.warn('* calculateFirstDigit', codeFrequency);
        for (let i = 0; i < CODE_FREQUENCY.length; i++) {
            if (codeFrequency === CODE_FREQUENCY[i]) {
                // console.warn('* returning', i);
                return i;
            }
        }
        // console.warn('* return null');
        return null;
    }

    protected _decodePayload(inCode: BarcodePosition, result: Array<number>, decodedCodes: Array<BarcodePosition>): BarcodeInfo | null {
        // console.warn('* decodePayload', inCode, result, decodedCodes);
        let outCode: BarcodeInfo | BarcodePosition | null = { ...inCode };
        let codeFrequency = 0x0;

        for (let i = 0; i < 6; i++) {
            outCode = this._decodeCode(outCode.end);
            // console.warn('* decodeCode=', outCode);
            if (!outCode) {
                // console.warn('* return null');
                return null;
            }
            if ((outCode as BarcodeInfo).code >= CODE_G_START) {
                (outCode as BarcodeInfo).code -= CODE_G_START;
                codeFrequency |= 1 << (5 - i);
            } else {
                codeFrequency |= 0 << (5 - i);
            }
            result.push((outCode as BarcodeInfo).code);
            decodedCodes.push(outCode);
        }

        const firstDigit = this._calculateFirstDigit(codeFrequency);
        // console.warn('* firstDigit=', firstDigit);
        if (firstDigit === null) {
            // console.warn('* return null');
            return null;
        }

        result.unshift(firstDigit);

        let middlePattern = this._findPattern(MIDDLE_PATTERN, outCode.end, true, false);
        // console.warn('* findPattern=', JSON.stringify(middlePattern));

        if (middlePattern === null || !middlePattern.end) {
            // console.warn('* return null');
            return null;
        }

        decodedCodes.push(middlePattern);

        for (let i = 0; i < 6; i++) {
            middlePattern = this._decodeCode(middlePattern!.end, CODE_G_START);
            // console.warn('* decodeCode=', JSON.stringify(middlePattern));

            if (!middlePattern) {
                // console.warn('* return null');
                return null;
            }

            decodedCodes.push(middlePattern);
            result.push((middlePattern as BarcodeInfo).code);
        }

        // console.warn('* end code=', JSON.stringify(middlePattern));
        // console.warn('* end result=', JSON.stringify(result));
        // console.warn('* end decodedCodes=', decodedCodes);
        return middlePattern as BarcodeInfo;
    }

    protected _verifyTrailingWhitespace(endInfo: BarcodePosition): BarcodePosition | null {
        // console.warn('* verifyTrailingWhitespace', JSON.stringify(endInfo));
        const trailingWhitespaceEnd = endInfo.end + (endInfo.end - endInfo.start);

        if (trailingWhitespaceEnd < this._row.length) {
            if (this._matchRange(endInfo.end, trailingWhitespaceEnd, 0)) {
                // console.warn('* returning', JSON.stringify(endInfo));
                return endInfo;
            }
        }
        // console.warn('* return null');
        return null;
    }

    protected _findEnd(offset: number, isWhite: boolean): BarcodePosition | null {
        // console.warn('* findEnd', offset, isWhite);
        const endInfo = this._findPattern(this.STOP_PATTERN, offset, isWhite, false);

        return endInfo !== null ? this._verifyTrailingWhitespace(endInfo) : null;
    }

    protected _checksum(result: Array<number>): boolean {
        // console.warn('* _checksum', result);
        let sum = 0;

        for (let i = result.length - 2; i >= 0; i -= 2) {
            sum += result[i];
        }

        sum *= 3;

        for (let i = result.length - 1; i >= 0; i -= 2) {
            sum += result[i];
        }

        // console.warn('* end checksum', sum % 10 === 0);
        return sum % 10 === 0;
    }

    private _decodeExtensions(offset: number): Barcode | null {
        const start = this._nextSet(this._row, offset);
        const startInfo = this._findPattern(EXTENSION_START_PATTERN, start, false, false);

        if (startInfo === null) {
            return null;
        }

        // console.warn('* decodeExtensions', this.supplements);
        // console.warn('* there are ', this.supplements.length, ' supplements');
        for (let i = 0; i < this.supplements.length; i++) {
            // console.warn('* extensions loop', i, this.supplements[i], this.supplements[i]._decode);
            try {
                let result = this.supplements[i]._decode(this._row, startInfo.end);
                // console.warn('* decode result=', result);
                if (result !== null) {
                    return {
                        code: result.code,
                        start,
                        startInfo,
                        end: result.end,
                        decodedCodes: result.decodedCodes,
                        format: this.supplements[i].FORMAT,
                    };
                }
            } catch (err) {
                console.error('* decodeExtensions error in ', this.supplements[i], ': ', err);
            }
        }

        // console.warn('* end decodeExtensions');
        return null;
    }

    _decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null {
        // console.warn('* decode', row);
        // console.warn('* decode', start);
        const result = new Array<number>();
        const decodedCodes = new Array<BarcodeInfo | BarcodePosition>();
        let resultInfo: Barcode | {} = {};
        let startInfo = this._findStart();

        if (!startInfo) {
            return null;
        }

        let code: BarcodePosition | BarcodeInfo | null = {
            start: startInfo.start,
            end: startInfo.end
        };
        decodedCodes.push(code);

        code = this._decodePayload(code, result, decodedCodes);

        if (!code) {
            return null;
        }

        code = this._findEnd(code.end, false);

        if (!code) {
            return null;
        }

        decodedCodes.push(code);

        // Checksum
        if (!this._checksum(result)) {
            return null;
        }

        // console.warn('* this.supplements=', this.supplements);
        if (this.supplements.length > 0) {
            const supplement = this._decodeExtensions(code.end);
            // console.warn('* decodeExtensions returns', supplement);
            if (!supplement) {
                return null;
            }

            if (!supplement.decodedCodes) {
                return null;
            }

            const lastCode = supplement.decodedCodes[supplement.decodedCodes.length - 1] as BarcodeInfo;
            const endInfo = {
                start: lastCode.start + (((lastCode.end - lastCode.start) / 2) | 0),
                end: lastCode.end
            };

            if (!this._verifyTrailingWhitespace(endInfo)) {
                return null;
            }

            resultInfo = {
                supplement,
                code: result.join('') + supplement.code
            };
        }

        return {
            code: result.join(''),
            start: startInfo.start,
            end: code.end,
            startInfo,
            decodedCodes,
            ...resultInfo,
            format: this.FORMAT,
        };
    }
}

export default EANReader;
