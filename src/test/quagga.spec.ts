/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import sinon from 'sinon';
import QuaggaJSStaticInterface from '../quagga';

const mockQuaggaInstance = {
    context: {},
    initializeData: () => {},
    initInputStream: (cb: () => void) => cb(),
};

describe('src/quagga.js', () => {
    afterEach(() => {
        sinon.restore();
    });

    const isErrorLike = (err: unknown): boolean => !!err && (
        err instanceof Error
        || (typeof DOMException !== 'undefined' && err instanceof DOMException)
        || typeof (err as { message?: string }).message === 'string'
    );

    describe('init', () => {
        it('returns undefined when callback provided', (done) => {
            // @ts-expect-error
            const ret = QuaggaJSStaticInterface.init({ }, done, null, mockQuaggaInstance);
            expect(ret).to.equal(undefined);
        });
        it('returns promise when no callback provided', () => {
            // @ts-expect-error
            const ret = QuaggaJSStaticInterface.init({ }, null, null, mockQuaggaInstance);
            expect(ret).to.be.a('promise');
            return ret;
        });
    });

    describe('start', () => {
        it('throws descriptive error when called without init() and no config provided', () => {
            // Call the actual start() method without any arguments
            // This should throw because init() was never called (framegrabber is undefined)
            expect(() => QuaggaJSStaticInterface.start()).to.throw(
                'start() was called before init() completed. '
                + 'Call init() first, or call start(config) to combine init and start.'
            );
        });

        it('error message when calling start before init includes helpful guidance', () => {
            try {
                QuaggaJSStaticInterface.start();
                expect.fail('Expected an error to be thrown');
            } catch (err: unknown) {
                const error = err as Error;
                expect(error.message).to.include('start() was called before init() completed');
                expect(error.message).to.include('Call init() first');
                expect(error.message).to.include('start(config)');
            }
        });

        it('start(config) rejects with "Image source (src) is required in stream configuration" when the source is missing', () => {
            const result = QuaggaJSStaticInterface.start({
                inputStream: { type: 'ImageStream', src: '' },
            });
            expect(result).to.be.a('promise');
            return result!.catch((err) => {
                expect(err).to.exist;
                expect(isErrorLike(err)).to.equal(true);
                expect((err as Error).message).to.equal('Image source (src) is required in stream configuration');
            });
        });

        it('start(config) with a bad file source rejects with the specific "error decoding pixels in loadImages" error', () => {
            const result = QuaggaJSStaticInterface.start({
                inputStream: { type: 'ImageStream', src: 'dummy.jpg' },
            });
            expect(result).to.be.a('promise');
            return result!.catch((err) => {
                expect(err).to.exist;
                expect(isErrorLike(err)).to.equal(true);
                expect((err as Error).message).to.equal('error decoding pixels in loadImages');
            });
        });

        it('start(config) returns a Promise when no callback is provided', () => {
            // When config is provided without a callback, start should return a Promise.
            const result = QuaggaJSStaticInterface.start({ inputStream: { type: 'ImageStream', src: 'dummy.jpg' } });
            expect(result).to.be.a('promise');
            return result!.catch((err) => {
                expect(err).to.exist;
                expect(isErrorLike(err)).to.equal(true);
            });
        });

        it('start(config, callback) returns undefined and calls callback', (done) => {
            // Stub init to immediately call its callback with no error
            const initStub = sinon.stub(QuaggaJSStaticInterface, 'init');
            initStub.callsFake((_config: unknown, cb: (err?: Error) => void) => {
                // Simulate successful init by calling callback with no error
                cb();
                return undefined;
            });

            const callback = sinon.spy((err: unknown) => {
                // Callback should be called after init succeeds
                // An error is expected because instance.start() will fail without proper setup
                expect(callback.called).to.be.true;
                // Verify that an error was passed to the callback
                expect(err).to.not.be.undefined;
                expect(err).to.not.be.null;
                done();
            });

            // Pass the spy function directly (not invoked) - sinon spies are callable
            const result = QuaggaJSStaticInterface.start(
                { inputStream: { type: 'ImageStream' } },
                callback
            );
            expect(result).to.equal(undefined);
        });
    });
});
