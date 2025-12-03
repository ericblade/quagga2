import { describe, it } from 'mocha';
import { expect } from 'chai';
import CameraAccess from '../../camera_access';
import Exception from '../../../quagga/Exception';

const Quagga = { CameraAccess };

describe('CameraAccess (node)', () => {
    describe('enumerateVideoDevices', () => {
        it('rejects', async () => {
            try {
                const x = await Quagga.CameraAccess.enumerateVideoDevices();
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err: unknown) {
                const ex = err as Exception;
                expect(ex.code).to.equal(-1);
                expect(ex.message).to.include('enumerateDevices is not defined');
            }
        });

        it('rejects with constraints parameter', async () => {
            try {
                const x = await Quagga.CameraAccess.enumerateVideoDevices({ width: 320 });
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err: unknown) {
                const ex = err as Exception;
                // In node, enumerateDevices is not available, so it should reject
                expect(ex.code).to.equal(-1);
                expect(ex.message).to.include('enumerateDevices is not defined');
            }
        });

        it('error includes helpful description when serialized', async () => {
            try {
                await Quagga.CameraAccess.enumerateVideoDevices();
                expect.fail('Should have thrown');
            } catch (err: unknown) {
                const json = JSON.stringify(err);
                const parsed = JSON.parse(json);
                expect(parsed.message).to.include('enumerateDevices is not defined');
                expect(parsed.message).to.include('iOS');
                expect(parsed.code).to.equal(-1);
            }
        });
    });

    describe('request', () => {
        it('rejects', async () => {
            try {
                const x = await Quagga.CameraAccess.request(null, {});
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err: unknown) {
                const ex = err as Exception;
                expect(ex.code).to.equal(-1);
                expect(ex.message).to.include('getUserMedia is not defined');
            }
        });

        it('error includes helpful description when serialized', async () => {
            try {
                await Quagga.CameraAccess.request(null, {});
                expect.fail('Should have thrown');
            } catch (err: unknown) {
                const json = JSON.stringify(err);
                const parsed = JSON.parse(json);
                expect(parsed.message).to.include('getUserMedia is not defined');
                expect(parsed.message).to.include('iOS');
                expect(parsed.code).to.equal(-1);
            }
        });
    });

    describe('release', () => {
        it('works (no-op)', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
            expect(Quagga.CameraAccess.release).to.not.throw;
        });
    });

    describe('getActiveStream', () => {
        it('no active stream', () => {
            const x = Quagga.CameraAccess.getActiveStream();
            expect(x).to.equal(null);
        });
    });

    describe('getActiveStreamLabel', () => {
        it('no active stream', () => {
            const x = Quagga.CameraAccess.getActiveStreamLabel();
            expect(x).to.equal('');
        });
    });
});
