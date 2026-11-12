import { describe, it } from 'mocha';
import { expect } from 'chai';
import CodabarReader from '../codabar_reader';

// Element patterns from the Codabar spec: 7 elements (bar, space, ... bar), 1 = wide.
const PATTERNS: Record<string, string> = {
    0: '0000011',
    1: '0000110',
    2: '0001001',
    3: '1100000',
    4: '0010010',
    5: '1000010',
    6: '0100001',
    7: '0100100',
    8: '0110000',
    9: '1001000',
    '-': '0001100',
    $: '0011000',
    ':': '1000101',
    '/': '1010001',
    '.': '1010100',
    '+': '0010101',
    A: '0011010',
    B: '0101001',
    C: '0001011',
    D: '0001110',
};

const NARROW = 4;
const WIDE = 10;
const QUIET = 40;

type Widths = number[];

// Element widths of a whole barcode: characters separated by a narrow gap.
function toWidths(text: string): Widths[] {
    return text.split('').map((char) => PATTERNS[char].split('').map((bit) => (bit === '1' ? WIDE : NARROW)));
}

function run(width: number, value: number): number[] {
    return new Array<number>(width).fill(value);
}

// Scanline: 1 = bar, 0 = space, with a quiet zone on both sides.
function toRow(chars: Widths[]): number[] {
    const row = run(QUIET, 0);
    chars.forEach((widths, index) => {
        if (index > 0) {
            row.push(...run(NARROW, 0));
        }
        widths.forEach((width, i) => {
            row.push(...run(width, i % 2 === 0 ? 1 : 0));
        });
    });
    row.push(...run(QUIET, 0));
    return row;
}

function decode(row: number[]): string | null {
    const result = new CodabarReader({}).decodePattern(row);
    return result ? result.code : null;
}

describe('Codabar Reader', () => {
    it('decodes a clean barcode', () => {
        expect(decode(toRow(toWidths('A1234567B')))).to.equal('A1234567B');
    });

    ['A1234:567B', 'A1234+567B', 'A1234/567B', 'A123.456B'].forEach((text) => {
        it(`decodes ${text} when one narrow space of each three-wide-bar character is a pixel wider`, () => {
            const chars = toWidths(text);
            text.split('').forEach((char, index) => {
                if (':/.+'.includes(char)) {
                    chars[index][5] += 1;
                }
            });
            expect(decode(toRow(chars))).to.equal(text);
        });
    });

    it('decodes all characters with the three-wide-bar characters next to each other', () => {
        const text = 'C0123456789-$:/.+D';
        const chars = toWidths(text).map((widths, index) => (
            ':/.+'.includes(text[index]) ? widths.map((width, i) => (i === 1 ? width + 1 : width)) : widths
        ));
        expect(decode(toRow(chars))).to.equal(text);
    });

    it('rejects a barcode whose bars in one character are far wider than in the rest', () => {
        const chars = toWidths('A1234567B');
        // every bar of "4" is three times too wide, so its narrow bars are wider
        // than the wide bars of the other characters
        chars[4] = chars[4].map((width, i) => (i % 2 === 0 ? width * 3 : width));
        expect(decode(toRow(chars))).to.equal(null);
    });
});
