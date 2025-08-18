const { describe, it } = require('mocha');
const { expect } = require('chai');

describe('testing node import', () => {
    let Q;
    
    before(async () => {
        // Use dynamic import to load the ES module
        const module = await import('../lib/quagga.js');
        Q = module.default;
    });
    
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
            'enableTorch', 'disableTorch',
        ]);
    });
});

// export default 1;
