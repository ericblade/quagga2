// Test that the Node bundle (lib/quagga.js) works correctly with decodeSingle
// This validates that the built bundle can decode images without createImageBitmap errors

const { expect } = require('chai');
const path = require('path');

describe('Node Bundle - decodeSingle', function() {
    this.timeout(10000); // Image decoding can take a few seconds

    let Quagga;

    before(function() {
        // Import the built Node bundle
        Quagga = require('../lib/quagga.js');
    });

    it('should decode a Code 128 barcode from the built lib/quagga.js', function(done) {
        const imagePath = path.join(__dirname, 'fixtures', 'code_128', 'image-001.jpg');

        Quagga.decodeSingle({
            src: imagePath,
            numOfWorkers: 0,
            inputStream: {
                size: 800
            },
            decoder: {
                readers: ['code_128_reader']
            },
        }, function(result) {
            if (result && result.codeResult) {
                expect(result.codeResult.code).to.be.a('string');
                expect(result.codeResult.code.length).to.be.greaterThan(0);
                console.log('Decoded:', result.codeResult.code);
                done();
            } else {
                done(new Error('Failed to decode barcode'));
            }
        });
    });
});
