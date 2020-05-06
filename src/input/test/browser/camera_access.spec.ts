import CameraAccess, { pickConstraints } from '../../camera_access';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { MediaTrackConstraintsWithDeprecated } from '../../../../type-definitions/quagga';

const Quagga = { CameraAccess };

describe('CameraAccess', () => {
    describe('pickConstraints', () => {
        it('should return the given constraints if no facingMode is defined', async () => {
            const givenConstraints = {width: 180};
            try {
                const actualConstraints = await pickConstraints(givenConstraints);
                expect(actualConstraints.video).to.deep.equal(givenConstraints);
            } catch (err_1) {
                expect(err_1).to.equal(null);
            }
        });

        it('should return the given constraints if deviceId is defined', async () => {
            const givenConstraints = {width: 180, deviceId: '4343'};
            try {
                const actualConstraints = await pickConstraints(givenConstraints);
                expect(actualConstraints.video).to.deep.equal(givenConstraints);
            } catch (err_1) {
                expect(err_1).to.equal(null);
            }
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
            expect(constraints.facing).to.be.undefined;
            expect(constraints.minAspectRatio).to.be.undefined;
            expect(constraints.maxAspectRatio).to.be.undefined;
        });
    });
    describe('release', () => {
        it('works', async () => {
            const video = document.createElement('video');
            await Quagga.CameraAccess.request(video, {});
            Quagga.CameraAccess.release();
            expect(((video?.srcObject) as any)?.active).to.equal(false);
        });
    });
    // TODO: Original tests also had the ability to stub out the browser's built-in
    // getUserMedia support, to test for failure to support or to allow permission
    // to getUserMedia.

    // describe('failure', function() {
    //     beforeEach(() => {
    //         setSupported(false);
    //     });

    //     afterEach(() => {
    //         setSupported(true);
    //     });

    //     describe('permission denied', function(){
    //         it('should throw if getUserMedia not available', function(done) {
    //             CameraAccess.request(video, {})
    //                 .catch(function (err) {
    //                     expect(err).to.be.defined;
    //                     done();
    //                 });
    //         });
    //     });

    //     describe('not available', function(){
    //         it('should throw if getUserMedia not available', function(done) {
    //             CameraAccess.request(video, {})
    //                 .catch((err) => {
    //                     expect(err).to.be.defined;
    //                     done();
    //                 });
    //         });
    //     });

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
