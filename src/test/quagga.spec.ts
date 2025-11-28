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

        it('error message includes helpful guidance', () => {
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

        it('start(config) returns a Promise when no callback is provided', () => {
            // When config is provided without a callback, start should return a Promise
            const result = QuaggaJSStaticInterface.start({ inputStream: { type: 'ImageStream' } });
            expect(result).to.be.a('promise');
            // The promise should reject since init will fail without proper setup
            // but we're primarily testing the return type here
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
                // but we're verifying the callback is invoked
                expect(callback.called).to.be.true;
                done();
            });

            const result = QuaggaJSStaticInterface.start(
                { inputStream: { type: 'ImageStream' } },
                callback
            );
            expect(result).to.equal(undefined);
        });
    });
});
