/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import QuaggaJSStaticInterface from '../quagga';

const mockQuaggaInstance = {
    context: {},
    initializeData: () => {},
    initInputStream: (cb: () => void) => cb(),
};

describe('src/quagga.js', () => {
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

        it('start(config, callback) returns undefined when callback is provided', () => {
            // When config and callback are provided, start should return undefined
            const result = QuaggaJSStaticInterface.start(
                { inputStream: { type: 'ImageStream' } },
                () => {
                    // Callback will be called (with error since init will fail)
                }
            );
            expect(result).to.equal(undefined);
        });
    });
});
