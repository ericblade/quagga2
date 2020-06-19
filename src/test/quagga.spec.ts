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
});
