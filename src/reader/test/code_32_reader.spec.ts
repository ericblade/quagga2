import { describe, it } from 'mocha';
import { expect } from 'chai';
import Code32Reader from '../code_32_reader';

describe('Code 32 checksum', () => {
    const reader = new Code32Reader({});

    it('accepts 012345676', () => {
        expect((reader as any)._checkChecksum('A012345676')).to.equal(true);
    });

    it('rejects 012345670', () => {
        expect((reader as any)._checkChecksum('A012345670')).to.equal(false);
    });

    it('keeps the fixture number A123456788', () => {
        expect((reader as any)._checkChecksum('A123456788')).to.equal(true);
    });
});
