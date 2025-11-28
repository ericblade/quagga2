import { expect } from 'chai';
import Quagga from '../../../quagga';

/**
 * Tests to verify that Data URIs work correctly in the browser environment.
 * This is a critical test case as mentioned in GitHub issue regarding Data URL support
 * (serratus/quaggaJS#433 referenced in the issue).
 *
 * In the browser, Data URLs are natively supported by the Image element,
 * which is used by image_loader.js. These tests confirm that the integration works.
 */
describe('Data URI Support (Browser)', () => {
    /**
     * Test that decodeSingle can process a Data URI containing a barcode image.
     * The browser uses native Image element which supports Data URLs natively.
     */
    describe('decodeSingle with Data URI', () => {
        it('should decode a Code 128 barcode from a Data URI', function(done) {
            this.timeout(20000); // Allow time for image processing

            // First, load the test image via fetch and convert to Data URI
            fetch('/test/fixtures/code_128/image-001.jpg')
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const dataUri = reader.result as string;

                        const config = {
                            src: dataUri,
                            inputStream: {
                                size: 800,
                            },
                            locator: {
                                patchSize: 'medium',
                                halfSample: true,
                            },
                            numOfWorkers: 0,
                            decoder: {
                                readers: ['code_128_reader'],
                            },
                            locate: true,
                        };

                        Quagga.decodeSingle(config).then((result) => {
                            try {
                                expect(result).to.be.an('Object');
                                expect(result.codeResult).to.be.an('Object');
                                expect(result.codeResult.code).to.equal('0001285112001000040801');
                                expect(result.codeResult.format).to.equal('code_128');
                                done();
                            } catch (err) {
                                done(err);
                            }
                        }).catch(done);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(done);
        });

        it('should decode an EAN-13 barcode from a Data URI', function(done) {
            this.timeout(20000);

            // First, load the test image via fetch and convert to Data URI
            fetch('/test/fixtures/ean/image-001.jpg')
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const dataUri = reader.result as string;

                        const config = {
                            src: dataUri,
                            inputStream: {
                                size: 640,
                            },
                            locator: {
                                patchSize: 'medium',
                                halfSample: true,
                            },
                            numOfWorkers: 0,
                            decoder: {
                                readers: ['ean_reader'],
                            },
                            locate: true,
                        };

                        Quagga.decodeSingle(config).then((result) => {
                            try {
                                expect(result).to.be.an('Object');
                                expect(result.codeResult).to.be.an('Object');
                                expect(result.codeResult.code).to.equal('3574660239843');
                                expect(result.codeResult.format).to.equal('ean_13');
                                done();
                            } catch (err) {
                                done(err);
                            }
                        }).catch(done);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(done);
        });

        it('should decode a barcode from a base64 Data URI string', function(done) {
            this.timeout(20000);

            // First, load the test image via fetch and convert to Data URI
            fetch('/test/fixtures/ean/image-002.jpg')
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const dataUri = reader.result as string;

                        // Verify we got a proper data URL
                        expect(dataUri).to.be.a('string');
                        expect(dataUri.startsWith('data:image/')).to.be.true;
                        expect(dataUri.includes('base64,')).to.be.true;

                        const config = {
                            src: dataUri,
                            inputStream: {
                                size: 640,
                            },
                            locator: {
                                patchSize: 'medium',
                                halfSample: true,
                            },
                            numOfWorkers: 0,
                            decoder: {
                                readers: ['ean_reader'],
                            },
                            locate: true,
                        };

                        Quagga.decodeSingle(config).then((result) => {
                            try {
                                expect(result).to.be.an('Object');
                                expect(result.codeResult).to.be.an('Object');
                                // image-002.jpg should decode to 8032754490297
                                expect(result.codeResult.code).to.equal('8032754490297');
                                expect(result.codeResult.format).to.equal('ean_13');
                                done();
                            } catch (err) {
                                done(err);
                            }
                        }).catch(done);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(done);
        });
    });
});
