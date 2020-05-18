import { describe, it } from 'mocha';
import { expect } from 'chai';
import { enumerateDevices, getUserMedia } from '../../mediaDevices';

describe('mediaDevices (browser)', () => {
    describe('enumerateDevices', () => {
        it('TODO: rejects with an error if enumerateDevices is not supported in browser version');
        it('returns a Promise', () => {
            expect(enumerateDevices()).to.be.a('Promise');
        });
        it('resolves with an Array of InputDeviceInfo', async () => {
            const d = await enumerateDevices();
            expect(d).to.be.an('Array').of.length.greaterThan(1);
            console.warn('* d=', d);
            expect(d[0]).to.be.an.instanceof(InputDeviceInfo);
        });
    });
    describe('getUserMedia', () => {
        it('TODO: rejects with an error if getUserMedia is not supported');
        it('returns a Promise', () => {
            expect(getUserMedia({})).to.be.a('Promise');
        });
    });
});
