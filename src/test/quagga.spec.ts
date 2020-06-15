import { expect } from 'chai';
import { describe, it } from 'mocha';
import QuaggaJSStaticInterface from '../quagga.js';

const mockQuaggaInstance = {
    context: {},
    initializeData: () => {},
    initInputStream: (cb) => {cb()},
}

describe('src/quagga.js', () => {
    describe('init', () => {
        it('returns undefined when callback provided', (done) => {
            const ret = QuaggaJSStaticInterface.init({}, done, null, mockQuaggaInstance);
            expect(ret).to.be.undefined;
        });
        it('returns promise when no callback provided', () => {
            const ret = QuaggaJSStaticInterface.init({}, null, null, mockQuaggaInstance);
            expect(ret).to.be.a('promise');
            return ret;
        });
    });
});
