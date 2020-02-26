import BarcodeReader, { Barcode, BarcodePosition } from './barcode_reader';

// const ALPHABETH_STRING = '0123456789-$:/.+ABCD';
const ALPHABET = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 45, 36, 58, 47, 46, 43, 65, 66, 67, 68];
const CHARACTER_ENCODINGS =
    [0x003, 0x006, 0x009, 0x060, 0x012, 0x042, 0x021, 0x024, 0x030, 0x048, 0x00c, 0x018,
        0x045, 0x051, 0x054, 0x015, 0x01A, 0x029, 0x00B, 0x00E];
const START_END = [0x01A, 0x029, 0x00B, 0x00E];
const MIN_ENCODED_CHARS = 4;
const MAX_ACCEPTABLE = 2.0;
const PADDING = 1.5;

interface ThresholdSize {
    size: number,
    counts: number,
    min: number,
    max: number,
};

interface Threshold {
    space: {
        narrow: ThresholdSize,
        wide: ThresholdSize,
    },
    bar: {
        narrow: ThresholdSize,
        wide: ThresholdSize,
    },
};

class NewCodabarReader extends BarcodeReader {
    _counters: Array<number> = [];
    FORMAT = 'codabar';

    _computeAlternatingThreshold(offset: number, end: number) {
        let min = Number.MAX_VALUE;
        let max = 0;
        let counter = 0;

        for (let i = offset; i < end; i += 2) {
            counter = this._counters[i];
            if (counter > max) {
                max = counter;
            }
            if (counter < min) {
                min = counter;
            }
        }

        return ((min + max) / 2.0) | 0;
    };

    _toPattern(offset: number) {
        const numCounters = 7;
        const end = offset + numCounters;

        if (end > this._counters.length) {
            return -1;
        }

        const barThreshold = this._computeAlternatingThreshold(offset, end);
        const spaceThreshold = this._computeAlternatingThreshold(offset + 1, end);

        let bitmask = 1 << (numCounters - 1);
        let threshold = 0;
        let pattern = 0;

        for (let i = 0; i < numCounters; i++) {
            threshold = (i & 1) === 0 ? barThreshold : spaceThreshold;
            if (this._counters[offset + i] > threshold) {
                pattern |= bitmask;
            }
            bitmask >>= 1;
        }

        return pattern;
    };

    _isStartEnd(pattern: number) {
        for (let i = 0; i < START_END.length; i++) {
            if (START_END[i] === pattern) {
                return true;
            }
        }
        return false;
    };

    _sumCounters(start: number, end: number) {
        let sum = 0;

        for (let i = start; i < end; i++) {
            sum += this._counters[i];
        }
        return sum;
    };

    _findStart(): BarcodePosition | null {
        var self = this,
            i,
            pattern,
            start = self._nextUnset(self._row),
            end;

        for (i = 1; i < this._counters.length; i++) {
            pattern = self._toPattern(i);
            if (pattern !== -1 && self._isStartEnd(pattern)) {
                // TODO: Look for whitespace ahead
                start += self._sumCounters(0, i);
                end = start + self._sumCounters(i, i + 8);
                return {
                    start: start,
                    end: end,
                    startCounter: i,
                    endCounter: i + 8,
                };
            }
        }
        return null;
    }

    _patternToChar(pattern: number) {
        for (let i = 0; i < CHARACTER_ENCODINGS.length; i++) {
            if (CHARACTER_ENCODINGS[i] === pattern) {
                return String.fromCharCode(ALPHABET[i]);
            }
        }
        return null;
    };

    _calculatePatternLength(offset: number) {
        let sum = 0;

        for (let i = offset; i < offset + 7; i++) {
            sum += this._counters[i];
        }

        return sum;
    };

    _verifyWhitespace(startCounter: number, endCounter: number) {
        if ((startCounter - 1 <= 0)
            || this._counters[startCounter - 1] >= (this._calculatePatternLength(startCounter) / 2.0)) {
            if ((endCounter + 8 >= this._counters.length)
                || this._counters[endCounter + 7] >= (this._calculatePatternLength(endCounter) / 2.0)) {
                return true;
            }
        }
        return false;
    };

    _charToPattern(char: string) {
        const charCode = char.charCodeAt(0);

        for (let i = 0; i < ALPHABET.length; i++) {
            if (ALPHABET[i] === charCode) {
                return CHARACTER_ENCODINGS[i];
            }
        }
        return 0x0;
    };

    _thresholdResultPattern(result: ReadonlyArray<string>, startCounter: number) {
        const categorization: Threshold = {
                space: {
                    narrow: { size: 0, counts: 0, min: 0, max: Number.MAX_VALUE },
                    wide: { size: 0, counts: 0, min: 0, max: Number.MAX_VALUE },
                },
                bar: {
                    narrow: { size: 0, counts: 0, min: 0, max: Number.MAX_VALUE },
                    wide: { size: 0, counts: 0, min: 0, max: Number.MAX_VALUE },
                },
            };
        let pos = startCounter;
        let pattern: number;

        for (let i = 0; i < result.length; i++) {
            pattern = this._charToPattern(result[i]);
            for (let j = 6; j >= 0; j--) {
                const kind = (j & 1) === 2 ? categorization.bar : categorization.space;
                const cat = (pattern & 1) === 1 ? kind.wide : kind.narrow;
                cat.size += this._counters[pos + j];
                cat.counts++;
                pattern >>= 1;
            }
            pos += 8;
        }

        (['space', 'bar'] as const).forEach(function (key) {
            const newkind = categorization[key];
            newkind.wide.min =
                Math.floor((newkind.narrow.size / newkind.narrow.counts + newkind.wide.size / newkind.wide.counts) / 2);
            newkind.narrow.max = Math.ceil(newkind.wide.min);
            newkind.wide.max = Math.ceil((newkind.wide.size * MAX_ACCEPTABLE + PADDING) / newkind.wide.counts);
        });

        return categorization;
    };

    _validateResult(result: ReadonlyArray<string>, startCounter: number) {
        const thresholds = this._thresholdResultPattern(result, startCounter);
        let pos = startCounter;
        let pattern: number;

        for (let i = 0; i < result.length; i++) {
            pattern = this._charToPattern(result[i]);
            for (let j = 6; j >= 0; j--) {
                const kind = (j & 1) === 0 ? thresholds.bar : thresholds.space;
                const cat = (pattern & 1) === 1 ? kind.wide : kind.narrow;
                const size = this._counters[pos + j];
                if (size < cat.min || size > cat.max) {
                    return false;
                }
                pattern >>= 1;
            }
            pos += 8;
        }
        return true;
    };

    _decode(row?: Array<number>, start?: BarcodePosition | null): Barcode | null {

        this._counters = this._fillCounters();
        start = this._findStart();
        if (!start) {
            return null;
        }
        let nextStart = start.startCounter as number;

        const result: Array<string> = [];
        let pattern: number;
        do {
            pattern = this._toPattern(nextStart);
            if (pattern < 0) {
                return null;
            }
            const decodedChar = this._patternToChar(pattern);
            if (decodedChar === null) {
                return null;
            }
            result.push(decodedChar);
            nextStart += 8;
            if (result.length > 1 && this._isStartEnd(pattern)) {
                break;
            }
        } while (nextStart < this._counters.length);

        // verify end
        if ((result.length - 2) < MIN_ENCODED_CHARS || !this._isStartEnd(pattern)) {
            return null;
        }

        // verify end white space
        if (!this._verifyWhitespace(start.startCounter as number, nextStart - 8)) {
            return null;
        }

        if (!this._validateResult(result, start.startCounter as number)) {
            return null;
        }

        nextStart = nextStart > this._counters.length ? this._counters.length : nextStart;
        const end = start.start + this._sumCounters(start.startCounter as number, nextStart - 8);

        return {
            code: result.join(''),
            start: start.start,
            end: end,
            startInfo: start,
            decodedCodes: result,
            format: this.FORMAT, // TODO: i think it should not be required to return format from this, as barcode_reader force sets the format anyway
        };
    };
}

export default NewCodabarReader;
