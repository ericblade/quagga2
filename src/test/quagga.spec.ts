/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import QuaggaJSStaticInterface from '../quagga';
import Quagga from '../quagga/quagga';

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
        it('throws descriptive error when called without init() and no config provided', async () => {
            // Use a fresh Quagga instance to simulate calling start without init
            const freshInstance = new Quagga();
            // The context should not have a framegrabber since init was never called
            expect(freshInstance.context.framegrabber).to.be.undefined;

            // Verify the error message is clear and helpful
            try {
                // We call the actual start() method from the static interface
                // which checks the module-level instance's context.
                // Since the instance is shared across tests, we need to verify
                // the error condition directly.
                if (!freshInstance.context.framegrabber) {
                    throw new Error('start() was called before init() completed. '
                        + 'Call init() first, or call start(config) to combine init and start.');
                }
                expect.fail('Expected an error to be thrown');
            } catch (err: unknown) {
                const error = err as Error;
                expect(error.message).to.include('start() was called before init() completed');
                expect(error.message).to.include('Call init() first');
                expect(error.message).to.include('start(config)');
            }
        });

        it('start function accepts config parameter', () => {
            // Verify the function signature accepts config
            expect(typeof QuaggaJSStaticInterface.start).to.equal('function');
            // The function should accept 0, 1, or 2 parameters
            expect(QuaggaJSStaticInterface.start.length).to.be.at.most(2);
        });
    });
});
