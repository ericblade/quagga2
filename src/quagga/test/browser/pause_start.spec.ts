import { describe, it, afterEach, beforeEach } from 'mocha';
import { expect } from 'chai';
import Quagga from '../../../quagga';
import CameraAccess from '../../../input/camera_access';

// These tests verify that Quagga.pause() and Quagga.start() work correctly with LiveStream.
// The tests use Cypress's fake camera device (via --use-fake-ui-for-media-stream and
// --use-fake-device-for-media-stream Chrome flags) to test pause/start functionality.

describe('Quagga pause/start (browser)', () => {
    let processedCount: number;
    let processedHandler: () => void;

    beforeEach(() => {
        processedCount = 0;
        processedHandler = () => {
            processedCount += 1;
        };
    });

    afterEach(async () => {
        Quagga.offProcessed(processedHandler);
        await Quagga.stop();
    });

    describe('pause()', () => {
        it('should stop frame processing when called after start()', function (done) {
            this.timeout(10000);

            // Create a container for the video element
            const container = document.createElement('div');
            container.id = 'test-container-pause';
            document.body.appendChild(container);

            Quagga.init({
                inputStream: {
                    type: 'LiveStream',
                    target: container,
                    constraints: {
                        width: 320,
                        height: 240,
                    },
                },
                decoder: {
                    readers: ['ean_reader'],
                },
                locate: false,
            }, (err) => {
                if (err) {
                    container.remove();
                    done(err);
                    return;
                }

                Quagga.onProcessed(processedHandler);
                Quagga.start();

                // Wait for some frames to be processed
                setTimeout(() => {
                    const countBeforePause = processedCount;
                    expect(countBeforePause).to.be.greaterThan(0, 'Should process some frames before pause');

                    // Pause and wait to ensure no more frames are processed
                    Quagga.pause();

                    // Wait and verify no more frames are processed
                    setTimeout(() => {
                        const countAfterPause = processedCount;
                        expect(countAfterPause).to.equal(countBeforePause,
                            'No frames should be processed after pause');

                        container.remove();
                        done();
                    }, 200);
                }, 500);
            });
        });
    });

    describe('start() after pause()', () => {
        it('should resume frame processing when called after pause()', function (done) {
            this.timeout(15000);

            // Create a container for the video element
            const container = document.createElement('div');
            container.id = 'test-container-resume';
            document.body.appendChild(container);

            Quagga.init({
                inputStream: {
                    type: 'LiveStream',
                    target: container,
                    constraints: {
                        width: 320,
                        height: 240,
                    },
                },
                decoder: {
                    readers: ['ean_reader'],
                },
                locate: false,
            }, (err) => {
                if (err) {
                    container.remove();
                    done(err);
                    return;
                }

                Quagga.onProcessed(processedHandler);
                Quagga.start();

                // Wait for some frames to be processed
                setTimeout(() => {
                    const countBeforePause = processedCount;
                    expect(countBeforePause).to.be.greaterThan(0, 'Should process some frames before pause');

                    // Pause
                    Quagga.pause();

                    // Wait to ensure pause takes effect
                    setTimeout(() => {
                        const countAfterPause = processedCount;

                        // Resume by calling start()
                        Quagga.start();

                        // Wait for more frames to be processed after resume
                        setTimeout(() => {
                            const countAfterResume = processedCount;
                            expect(countAfterResume).to.be.greaterThan(countAfterPause,
                                'Should process more frames after resume');

                            container.remove();
                            done();
                        }, 500);
                    }, 200);
                }, 500);
            });
        });

        it('should correctly handle multiple pause/start cycles', function (done) {
            this.timeout(12000);

            const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            const runTest = async () => {
                // Create a container for the video element
                const container = document.createElement('div');
                container.id = 'test-container-cycles';
                document.body.appendChild(container);

                try {
                    await new Promise<void>((resolve, reject) => {
                        Quagga.init({
                            inputStream: {
                                type: 'LiveStream',
                                target: container,
                                constraints: { width: 320, height: 240 },
                            },
                            decoder: { readers: ['ean_reader'] },
                            locate: false,
                        }, (err) => (err ? reject(err) : resolve()));
                    });

                    Quagga.onProcessed(processedHandler);
                    Quagga.start();

                    // First cycle - start processing
                    await delay(250);
                    const count1 = processedCount;
                    expect(count1).to.be.greaterThan(0, 'Should process frames in first cycle');

                    // First pause
                    Quagga.pause();
                    await delay(100);
                    expect(processedCount).to.equal(count1, 'No frames during first pause');

                    // Second cycle - resume processing
                    Quagga.start();
                    await delay(250);
                    const count2 = processedCount;
                    expect(count2).to.be.greaterThan(count1, 'Should process frames in second cycle');

                    // Second pause
                    Quagga.pause();
                    await delay(100);
                    expect(processedCount).to.equal(count2, 'No frames during second pause');

                    // Third cycle - resume processing
                    Quagga.start();
                    await delay(250);
                    expect(processedCount).to.be.greaterThan(count2, 'Should process frames in third cycle');

                    done();
                } catch (err) {
                    done(err);
                } finally {
                    container.remove();
                }
            };

            runTest();
        });
    });

    describe('pause() with MediaStream track', () => {
        it('should keep the camera track active when paused', function (done) {
            this.timeout(10000);

            // Create a container for the video element
            const container = document.createElement('div');
            container.id = 'test-container-track';
            document.body.appendChild(container);

            Quagga.init({
                inputStream: {
                    type: 'LiveStream',
                    target: container,
                    constraints: {
                        width: 320,
                        height: 240,
                    },
                },
                decoder: {
                    readers: ['ean_reader'],
                },
                locate: false,
            }, (err) => {
                if (err) {
                    container.remove();
                    done(err);
                    return;
                }

                Quagga.start();

                // Check that the camera stream is active
                const streamBefore = CameraAccess.getActiveStream();
                expect(streamBefore).to.not.be.null;
                expect(streamBefore?.active).to.equal(true, 'Stream should be active before pause');

                const trackBefore = CameraAccess.getActiveTrack();
                expect(trackBefore).to.not.be.null;
                expect(trackBefore?.readyState).to.equal('live', 'Track should be live before pause');

                // Pause
                Quagga.pause();

                // Verify that the camera stream is still active after pause
                // (pause() only stops frame processing, not the camera)
                setTimeout(() => {
                    const streamAfter = CameraAccess.getActiveStream();
                    expect(streamAfter).to.not.be.null;
                    expect(streamAfter?.active).to.equal(true,
                        'Stream should remain active after pause');

                    const trackAfter = CameraAccess.getActiveTrack();
                    expect(trackAfter).to.not.be.null;
                    expect(trackAfter?.readyState).to.equal('live',
                        'Track should remain live after pause');

                    container.remove();
                    done();
                }, 200);
            });
        });
    });
});
