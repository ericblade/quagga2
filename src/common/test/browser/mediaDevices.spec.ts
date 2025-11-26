import { describe, it } from 'mocha';
import { expect } from 'chai';
import { enumerateDevices, getUserMedia } from '../../mediaDevices';

describe('mediaDevices (browser)', () => {
    describe('enumerateDevices', () => {
        it('rejects with an error if enumerateDevices is not supported in browser version', async () => {
            const origEnumerateDevices = navigator.mediaDevices.enumerateDevices;
            (navigator.mediaDevices as any).enumerateDevices = undefined;
            try {
                await enumerateDevices();
                expect.fail('Should have thrown due to missing enumerateDevices');
            } catch (err) {
                expect(err).to.exist;
            } finally {
                (navigator.mediaDevices as any).enumerateDevices = origEnumerateDevices;
            }
        });
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
        it('rejects with an error if getUserMedia is not supported', async () => {
            const origGetUserMedia = navigator.mediaDevices.getUserMedia;
            (navigator.mediaDevices as any).getUserMedia = undefined;
            try {
                await getUserMedia({});
                expect.fail('Should have thrown due to missing getUserMedia');
            } catch (err) {
                expect(err).to.exist;
            } finally {
                (navigator.mediaDevices as any).getUserMedia = origGetUserMedia;
            }
        });
        it('returns a Promise', () => {
            expect(getUserMedia({})).to.be.a('Promise');
        });
    });
});
