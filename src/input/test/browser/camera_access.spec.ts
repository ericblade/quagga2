import { describe, it, after } from 'mocha';
import { expect } from 'chai';
import CameraAccess, { pickConstraints } from '../../camera_access';
import { MediaTrackConstraintsWithDeprecated } from '../../../../type-definitions/quagga.d';

const Quagga = { CameraAccess };

describe('CameraAccess (browser)', () => {
    // TODO: move pickConstraints tests into "universal" test, no reason it shouldn't work in node, even if you wouldn't use it.
    // TODO: consider moving the entire CameraAccess section to a separate library
    describe('pickConstraints', () => {
        it('should return the given constraints if no facingMode is defined', async () => {
            const givenConstraints = { width: 180 };
            const actualConstraints = await pickConstraints(givenConstraints);
            expect(actualConstraints.video).to.deep.equal(givenConstraints);
        });

        it('should return the given constraints if deviceId is defined', async () => {
            const givenConstraints = { width: 180, deviceId: '4343' };
            const actualConstraints = await pickConstraints(givenConstraints);
            expect(actualConstraints.video).to.deep.equal(givenConstraints);
        });

        it('should remove facingMode if deviceId is defined', async () => {
            const givenConstraints = { deviceId: 'dummy', facingMode: 'user' };
            const actualConstraints = await pickConstraints(givenConstraints);
            expect(actualConstraints.video).to.deep.equal({ deviceId: 'dummy' });
        });
    });

    describe('enumerateVideoDevices', () => {
        it('works', async () => {
            // TODO: if someone runs this test in live Chrome with no video devices, it should
            // fail .. hmm...
            const v = await Quagga.CameraAccess.enumerateVideoDevices();
            expect(v).to.be.an('Array').of.length(1);
            expect(v[0]).to.be.an.instanceof(InputDeviceInfo);
            expect(v[0].deviceId).to.be.a('string');
            expect(v[0].groupId).to.be.a('string');
            expect(v[0].kind).to.equal('videoinput');
            expect(v[0].label).to.equal('fake_device_0');
        });
    });

    describe('request', () => {
        it('works', async () => {
            after(() => Quagga.CameraAccess.release());
            const video = document.createElement('video');
            await Quagga.CameraAccess.request(video, {});
            expect(video.srcObject).to.not.equal(null);
            // "as any" here to prevent typescript blowing up because it doesn't understand 'id' and
            // 'active' as members of MediaStream | MediaSource | Blob .. why?
            expect(((video?.srcObject) as any)?.id).to.be.a('string');
            expect(((video?.srcObject) as any)?.active).to.equal(true);
            // TODO: ensure we cleanup our video element after this
        });

        it('should allow deprecated constraints to be used', async () => {
            after(() => Quagga.CameraAccess.release());
            const video = document.createElement('video');
            await Quagga.CameraAccess.request(video, {
                width: 320, height: 240, facing: 'user', minAspectRatio: 2, maxAspectRatio: 100,
            });
            const activeTrack = Quagga.CameraAccess.getActiveTrack();
            const constraints = activeTrack?.getConstraints() as MediaTrackConstraintsWithDeprecated;
            if (!constraints) {
                throw new Error('no active track constraints');
            }
            expect(constraints.width).to.equal(320);
            expect(constraints.height).to.equal(240);
            expect(constraints.facingMode).to.equal('user');
            expect(constraints.aspectRatio).to.equal(2);
            /* eslint-disable no-unused-expressions */
            /* eslint-disable @typescript-eslint/no-unused-expressions */
            expect(constraints.facing).to.not.exist;
            expect(constraints.minAspectRatio).to.not.exist;
            expect(constraints.maxAspectRatio).to.not.exist;
            /* eslint-enable no-unused-expressions */
            /* eslint-enable @typescript-eslint/no-unused-expressions */
        });

        it('will fail on NotAllowedError', async () => {
            after(() => Quagga.CameraAccess.release());
            cy.stub(navigator.mediaDevices, 'getUserMedia').rejects(new DOMException('Not Allowed', 'NotAllowedError'));
            const video = document.createElement('video');
            try {
                const x = await Quagga.CameraAccess.request(video, { width: 320, height: 240 });
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err) {
                expect(err).to.be.an.instanceOf(DOMException);
                expect(err.name).to.equal('NotAllowedError');
            }
        });

        it('fails eventually on unacceptable video size', async function () {
            this.timeout(10000);
            after(() => Quagga.CameraAccess.release());
            const video = document.createElement('video');
            try {
                const x = await Quagga.CameraAccess.request(video, { width: 5, height: 5 });
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
                expect(x).to.not.exist;
            } catch (err) {
                expect(err.message).to.equal('Unable to play video stream. Is webcam working?');
            }
        });
        // TODO: need to add a test for no support in browser to straight up fail
    });

    describe('release', () => {
        it('works', async () => {
            const video = document.createElement('video');
            await Quagga.CameraAccess.request(video, {});
            await Quagga.CameraAccess.release();
            expect(((video?.srcObject) as any)?.active).to.equal(false);
        });
    });

    describe('getActiveStreamLabel', () => {
        it('no active stream', () => {
            const x = Quagga.CameraAccess.getActiveStreamLabel();
            expect(x).to.equal('');
        });

        it('with active stream', async () => {
            after(() => Quagga.CameraAccess.release());
            const video = document.createElement('video');
            await Quagga.CameraAccess.request(video, {});
            const x = Quagga.CameraAccess.getActiveStreamLabel();
            const v = await Quagga.CameraAccess.enumerateVideoDevices();
            expect(x).to.equal(v[0].label);
        });
    });
});
