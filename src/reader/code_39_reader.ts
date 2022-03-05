/* eslint-disable class-methods-use-this */
import ArrayHelper from '../common/array_helper';
import BarcodeReader, { type BarcodePosition, type Barcode } from './barcode_reader';

const ALPHABETH_STRING = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. *$/+%';
const ALPHABET = new Uint16Array([...ALPHABETH_STRING].map((char) => char.charCodeAt(0)));
const CHARACTER_ENCODINGS = new Uint16Array([
    0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064, 0x109, 0x049,
    0x148, 0x019, 0x118, 0x058, 0x00D, 0x10C, 0x04C, 0x01C, 0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106,
    0x046, 0x016, 0x181, 0x0C1, 0x1C0, 0x091, 0x190, 0x0D0, 0x085, 0x184, 0x0C4, 0x094, 0x0A8, 0x0A2, 0x08A, 0x02A,
]);
const ASTERISK = 0x094;

class Code39Reader extends BarcodeReader {
    FORMAT = 'code_39';

    protected _findStart(): BarcodePosition | null {
        const offset = this._nextSet(this._row);
        let patternStart = offset;
        const counter = new Uint16Array([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        let counterPos = 0;
        let isWhite = false;

        for (let i = offset; i < this._row.length; i++) {
            // eslint-disable-next-line no-bitwise
            if (this._row[i] ^ (isWhite ? 1 : 0)) {
                counter[counterPos]++;
            } else {
                if (counterPos === counter.length - 1) {
                    // find start pattern
                    if (this._toPattern(counter) === ASTERISK) {
                        const whiteSpaceMustStart = Math.floor(Math.max(0, patternStart - ((i - patternStart) / 4)));
                        if (this._matchRange(whiteSpaceMustStart, patternStart, 0)) {
                            return {
                                start: patternStart,
                                end: i,
                            };
                        }
                    }

                    patternStart += counter[0] + counter[1];
                    for (let j = 0; j < 7; j++) {
                        counter[j] = counter[j + 2];
                    }
                    counter[7] = 0;
                    counter[8] = 0;
                    counterPos--;
                } else {
                    counterPos++;
                }
                counter[counterPos] = 1;
                isWhite = !isWhite;
            }
        }
        return null;
    }

    protected _toPattern(counters: Uint16Array): number {
        const numCounters = counters.length;
        let maxNarrowWidth = 0;
        let numWideBars = numCounters;
        let wideBarWidth = 0;

        while (numWideBars > 3) {
            maxNarrowWidth = this._findNextWidth(counters, maxNarrowWidth);
            numWideBars = 0;
            let pattern = 0;
            for (let i = 0; i < numCounters; i++) {
                if (counters[i] > maxNarrowWidth) {
                    // eslint-disable-next-line no-bitwise
                    pattern |= 1 << (numCounters - 1 - i);
                    numWideBars++;
                    wideBarWidth += counters[i];
                }
            }

            if (numWideBars === 3) {
                for (let i = 0; i < numCounters && numWideBars > 0; i++) {
                    if (counters[i] > maxNarrowWidth) {
                        numWideBars--;
                        if ((counters[i] * 2) >= wideBarWidth) {
                            return -1;
                        }
                    }
                }
                return pattern;
            }
        }
        return -1;
    }

    protected _findNextWidth(counters: Uint16Array, current: number): number {
        let minWidth = Number.MAX_VALUE;

        for (let i = 0; i < counters.length; i++) {
            if (counters[i] < minWidth && counters[i] > current) {
                minWidth = counters[i];
            }
        }

        return minWidth;
    }

    protected _patternToChar(pattern: number): string | null {
        for (let i = 0; i < CHARACTER_ENCODINGS.length; i++) {
            if (CHARACTER_ENCODINGS[i] === pattern) {
                return String.fromCharCode(ALPHABET[i]);
            }
        }
        return null;
    }

    protected _verifyTrailingWhitespace(lastStart: number, nextStart: number, counters: Uint16Array): boolean {
        const patternSize = ArrayHelper.sum(counters);

        const trailingWhitespaceEnd = nextStart - lastStart - patternSize;
        if ((trailingWhitespaceEnd * 3) >= patternSize) {
            return true;
        }
        return false;
    }

    public decode(): Barcode | null {
        let counters = new Uint16Array([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        const result: Array<string> = [];
        const start = this._findStart();

        if (!start) {
            return null;
        }
        let nextStart = this._nextSet(this._row, start.end);

        let decodedChar;
        let lastStart: number;
        do {
            counters = this._toCounters(nextStart, counters) as Uint16Array;
            const pattern = this._toPattern(counters);
            if (pattern < 0) {
                return null;
            }
            decodedChar = this._patternToChar(pattern);
            if (decodedChar === null) {
                return null;
            }
            result.push(decodedChar);
            lastStart = nextStart;
            nextStart += ArrayHelper.sum(counters);
            nextStart = this._nextSet(this._row, nextStart);
        } while (decodedChar !== '*');
        result.pop();

        if (!result.length) {
            return null;
        }

        if (!this._verifyTrailingWhitespace(lastStart, nextStart, counters)) {
            return null;
        }

        return {
            code: result.join(''),
            start: start.start,
            end: nextStart,
            startInfo: start,
            decodedCodes: result,
            format: this.FORMAT,
        };
    }
}

export default Code39Reader;
