import { describe, it } from 'mocha';
import { expect } from 'chai';
import Code128Reader from '../code_128_reader';

const MODULE = 3;
const QUIET = 40;
const START_B = 104;
const START_C = 105;
const STOP = 106;
const FNC1 = String.fromCharCode(29);

// Scanline (1 = bar, 0 = space) for the given symbol values, check symbol and stop added.
function toRow(reader: Code128Reader, start: number, values: number[]): number[] {
    let checksum = start;
    values.forEach((value, index) => {
        checksum += (index + 1) * value;
    });
    const symbols = [start, ...values, checksum % 103, STOP];
    const row: number[] = new Array<number>(QUIET).fill(0);
    symbols.forEach((symbol) => {
        reader.CODE_PATTERN[symbol].forEach((width, i) => {
            for (let p = 0; p < width * MODULE; p++) {
                row.push(i % 2 === 0 ? 1 : 0);
            }
        });
    });
    return row.concat(new Array<number>(QUIET).fill(0));
}

function decode(start: number, values: number[]): string | null {
    const reader = new Code128Reader({});
    const result = reader.decodePattern(toRow(reader, start, values));
    return result ? result.code : null;
}

// Code set B value of an ASCII character.
const b = (text: string) => text.split('').map((char) => char.charCodeAt(0) - 32);

describe('Code 128 Reader', () => {
    it('decodes a code set B barcode', () => {
        expect(decode(START_B, b('ABC'))).to.equal('ABC');
    });

    it('does not add FNC1 when the check symbol value is 102', () => {
        // (104 + 1*33 + 2*33 + 3*33 + 4*53) % 103 === 102
        expect(decode(START_B, b('AAAU'))).to.equal('AAAU');
    });

    it('does not add FNC1 when the check symbol value is 102 in code set C', () => {
        // (105 + 1*12 + 2*34 + 3*56 + 4*66) % 103 === 102
        expect(decode(START_C, [12, 34, 56, 66])).to.equal('12345666');
    });

    it('drops only the check symbol when it switches code set', () => {
        // (104 + 1*33 + 2*33 + 3*34) % 103 === 99 (CODE_C)
        expect(decode(START_B, b('AAB'))).to.equal('AAB');
        // (104 + 1*33 + 2*33 + 3*68) % 103 === 98 (SHIFT)
        expect(decode(START_B, b('AAd'))).to.equal('AAd');
    });

    it('keeps an FNC1 that is part of the data', () => {
        expect(decode(START_B, [102, ...b('42')])).to.equal(`${FNC1}42`);
    });
});
