import BarcodeReader, { BarcodePosition, Barcode } from './barcode_reader';
import ArrayHelper from '../common/array_helper';

const ALPHABETH_STRING = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*';
const ALPHABET = new Uint16Array([...ALPHABETH_STRING].map(char => char.charCodeAt(0)));
const CHARACTER_ENCODINGS = new Uint16Array([
    0x114, 0x148, 0x144, 0x142, 0x128, 0x124, 0x122, 0x150, 0x112, 0x10A,
    0x1A8, 0x1A4, 0x1A2, 0x194, 0x192, 0x18A, 0x168, 0x164, 0x162, 0x134,
    0x11A, 0x158, 0x14C, 0x146, 0x12C, 0x116, 0x1B4, 0x1B2, 0x1AC, 0x1A6,
    0x196, 0x19A, 0x16C, 0x166, 0x136, 0x13A, 0x12E, 0x1D4, 0x1D2, 0x1CA,
    0x16E, 0x176, 0x1AE, 0x126, 0x1DA, 0x1D6, 0x132, 0x15E,
]);
const ASTERISK = 0x15E;

class Code93Reader extends BarcodeReader {
    FORMAT = 'code_93';
    protected _patternToChar(pattern: number): string | null {
        for (let i = 0; i < CHARACTER_ENCODINGS.length; i++) {
            if (CHARACTER_ENCODINGS[i] === pattern) {
                return String.fromCharCode(ALPHABET[i]);
            }
        }
        return null;
    };

    protected _toPattern(counters: Uint16Array): number {
        const numCounters = counters.length;
        const sum = counters.reduce((prev, next) => prev + next, 0);
        let pattern = 0;

        for (let i = 0; i < numCounters; i++) {
            let normalized = Math.round(counters[i] * 9 / sum);
            if (normalized < 1 || normalized > 4) {
                return -1;
            }
            if ((i & 1) === 0) {
                for (let j = 0; j < normalized; j++) {
                    pattern = (pattern << 1) | 1;
                }
            } else {
                pattern <<= normalized;
            }
        }
        return pattern;
    };

    protected _findStart(): BarcodePosition | null {
        const offset = this._nextSet(this._row);
        let patternStart = offset;
        const counter = new Uint16Array([0, 0, 0, 0, 0, 0]);
        let counterPos = 0;
        let isWhite = false;

        for (let i = offset; i < this._row.length; i++) {
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
                    for (let j = 0; j < 4; j++) {
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

    protected _verifyEnd(lastStart: number, nextStart: number): boolean {
        if (lastStart === nextStart || !this._row[nextStart]) {
            return false;
        }
        return true;
    };

    protected _decodeExtended(charArray: Array<string>): string[] | null {
        const length = charArray.length;
        const result: Array<string> = [];
        for (let i = 0; i < length; i++) {
            const char = charArray[i];
            if (char >= 'a' && char <= 'd') {
                if (i > (length - 2)) {
                    return null;
                }
                const nextChar = charArray[++i];
                const nextCharCode = nextChar.charCodeAt(0);
                let decodedChar;
                switch (char) {
                    case 'a':
                        if (nextChar >= 'A' && nextChar <= 'Z') {
                            decodedChar = String.fromCharCode(nextCharCode - 64);
                        } else {
                            return null;
                        }
                        break;
                    case 'b':
                        if (nextChar >= 'A' && nextChar <= 'E') {
                            decodedChar = String.fromCharCode(nextCharCode - 38);
                        } else if (nextChar >= 'F' && nextChar <= 'J') {
                            decodedChar = String.fromCharCode(nextCharCode - 11);
                        } else if (nextChar >= 'K' && nextChar <= 'O') {
                            decodedChar = String.fromCharCode(nextCharCode + 16);
                        } else if (nextChar >= 'P' && nextChar <= 'S') {
                            decodedChar = String.fromCharCode(nextCharCode + 43);
                        } else if (nextChar >= 'T' && nextChar <= 'Z') {
                            decodedChar = String.fromCharCode(127);
                        } else {
                            return null;
                        }
                        break;
                    case 'c':
                        if (nextChar >= 'A' && nextChar <= 'O') {
                            decodedChar = String.fromCharCode(nextCharCode - 32);
                        } else if (nextChar === 'Z') {
                            decodedChar = ':';
                        } else {
                            return null;
                        }
                        break;
                    case 'd':
                        if (nextChar >= 'A' && nextChar <= 'Z') {
                            decodedChar = String.fromCharCode(nextCharCode + 32);
                        } else {
                            return null;
                        }
                        break;
                    default:
                        console.warn('* code_93_reader _decodeExtended hit default case, this may be an error', decodedChar);
                        return null;
                }
                result.push(decodedChar);
            } else {
                result.push(char);
            }
        }
        return result;
    };

    protected _matchCheckChar(charArray: Array<string>, index: number, maxWeight: number): boolean {
        const arrayToCheck = charArray.slice(0, index);
        const length = arrayToCheck.length;
        const weightedSums = arrayToCheck.reduce((sum, char, i) => {
            const weight = (((i * -1) + (length - 1)) % maxWeight) + 1;
            const value = ALPHABET.indexOf(char.charCodeAt(0));
            return sum + (weight * value);
        }, 0);

        const checkChar = ALPHABET[(weightedSums % 47)];
        return checkChar === charArray[index].charCodeAt(0);
    };

    protected _verifyChecksums(charArray: Array<string>): boolean {
        return this._matchCheckChar(charArray, charArray.length - 2, 20)
            && this._matchCheckChar(charArray, charArray.length - 1, 15);
    };

    public decode(row?: Array<number>, start?: BarcodePosition | number | null): Barcode | null {
        start = this._findStart();
        if (!start) {
            return null;
        }

        let counters = new Uint16Array([0, 0, 0, 0, 0, 0]);
        let result: Array<string> | null = [];
        let nextStart = this._nextSet(this._row, start.end);
        let lastStart;
        let decodedChar: string | null;
        do {
            counters = this._toCounters(nextStart, counters) as Uint16Array<ArrayBuffer>;
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

        if (!this._verifyEnd(lastStart, nextStart)) {
            return null;
        }

        if (!this._verifyChecksums(result)) {
            return null;
        }

        result = result.slice(0, result.length - 2);
        // yes, this is an assign inside an if.
        if ((result = this._decodeExtended(result)) === null) {
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

export default Code93Reader;
