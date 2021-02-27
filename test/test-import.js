import * as Mocha from 'mocha';
const { describe, it } = Mocha.default;
import * as Chai from 'chai';
const { expect } = Chai.default;
import Q from '../lib/quagga.js';

describe('testing node import', () => {
    it('import works', () => {
        expect(Q).to.be.an('object');
        expect(Q.init).to.be.a('function');
        expect(Q.start).to.be.a('function');
        expect(Q.stop).to.be.a('function');
    });
    it('contains CameraAccess', () => {
        const { CameraAccess: CA } = Q;
        expect(CA).to.be.an('object').with.keys([
            'request', 'release', 'enumerateVideoDevices',
            'getActiveStreamLabel', 'getActiveTrack', 'requestedVideoElement',
        ]);
    });
});

// export default 1;
