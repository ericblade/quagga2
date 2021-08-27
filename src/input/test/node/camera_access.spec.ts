import { describe, it } from 'mocha';
import { expect } from 'chai';
import CameraAccess from '../../camera_access';

const Quagga = { CameraAccess };

describe('CameraAccess (node)', () => {
    describe('enumerateVideoDevices', () => {
        it('rejects', async () => {
            try {
                const x = await Quagga.CameraAccess.enumerateVideoDevices();
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err: any) { // TODO: error TS1196: Catch clause variable type annotation must be 'any' or 'unknown' if specified.
                // expect(err.message).to.equal('enumerateDevices is not defined');
                expect(err.code).to.equal(-1);
            }
        });
    });

    describe('request', () => {
        it('rejects', async () => {
            try {
                const x = await Quagga.CameraAccess.request(null, {});
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err: any) { // TODO: error TS1196: Catch clause variable type annotation must be 'any' or 'unknown' if specified.
                // expect(err.message).to.equal('getUserMedia is not defined');
                expect(err.code).to.equal(-1);
            }
        });
    });

    describe('release', () => {
        it('works (no-op)', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
            expect(Quagga.CameraAccess.release).to.not.throw;
        });
    });

    describe('getActiveStreamLabel', () => {
        it('no active stream', () => {
            const x = Quagga.CameraAccess.getActiveStreamLabel();
            expect(x).to.equal('');
        });
    });
});
