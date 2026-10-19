import { describe, it } from 'mocha';
import { expect } from 'chai';
import Code32Reader from '../../code_32_reader';

describe('Code32Reader constructor', () => {
    it('allows zero-argument construction', () => {
        const reader = new Code32Reader();
        expect(reader.config).to.deep.equal({});
        expect(reader.FORMAT).to.match(/code_32/);
    });
});
