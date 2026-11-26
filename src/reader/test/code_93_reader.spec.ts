import { describe, it } from 'mocha';
import { expect } from 'chai';
import Code93Reader from '../code_93_reader';

const MODULE = 3;
const QUIET = 40;
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*';
const ENCODINGS = [
    0x114, 0x148, 0x144, 0x142, 0x128, 0x124, 0x122, 0x150, 0x112, 0x10A,
    0x1A8, 0x1A4, 0x1A2, 0x194, 0x192, 0x18A, 0x168, 0x164, 0x162, 0x134,
    0x11A, 0x158, 0x14C, 0x146, 0x12C, 0x116, 0x1B4, 0x1B2, 0x1AC, 0x1A6,
    0x196, 0x19A, 0x16C, 0x166, 0x136, 0x13A, 0x12E, 0x1D4, 0x1D2, 0x1CA,
    0x16E, 0x176, 0x1AE, 0x126, 0x1DA, 0x1D6, 0x132, 0x15E,
];

function checkChar(values: number[], maxWeight: number): number {
    const sum = values.reduce((acc, value, i) => acc + value * (((values.length - 1 - i) % maxWeight) + 1), 0);
    return sum % 47;
}

// Scanline (1 = bar, 0 = space) for the given symbols ('a'-'d' are the shift
// characters), with check characters, start/stop and termination bar added.
function toRow(symbols: string): number[] {
    const values = symbols.split('').map((char) => ALPHABET.indexOf(char));
    values.push(checkChar(values, 20));
    values.push(checkChar(values, 15));
    const star = ALPHABET.indexOf('*');
    const row: number[] = new Array<number>(QUIET).fill(0);
    [star, ...values, star].forEach((value) => {
        ENCODINGS[value].toString(2).split('').forEach((module) => {
            for (let p = 0; p < MODULE; p++) {
                row.push(Number(module));
            }
        });
    });
    for (let p = 0; p < MODULE; p++) {
        row.push(1);
    }
    return row.concat(new Array<number>(QUIET).fill(0));
}

function decode(symbols: string): string | null {
    const reader = new Code93Reader({});
    const result = reader.decodePattern(toRow(symbols));
    return result ? result.code : null;
}

describe('Code 93 Reader', () => {
    it('decodes a plain barcode', () => {
        expect(decode('CODE93')).to.equal('CODE93');
    });

    it('decodes full ASCII shift pairs', () => {
        expect(decode('dCdAdT')).to.equal('cat');
        expect(decode('cAcZ')).to.equal('!:');
        expect(decode('bAbFbKbP')).to.equal('\x1b;[{');
    });

    it('decodes (%)U as NUL, (%)V as @ and (%)W as `', () => {
        expect(decode('AbUB')).to.equal('A\x00B');
        expect(decode('AbVB')).to.equal('A@B');
        expect(decode('AbWB')).to.equal('A`B');
    });

    it('decodes (%)T and (%)X to (%)Z as DEL', () => {
        expect(decode('bTbXbYbZ')).to.equal('\x7f\x7f\x7f\x7f');
    });
});
