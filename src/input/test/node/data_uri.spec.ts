import { describe, it } from 'mocha';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import Quagga from '../../../quagga';

/**
 * Tests to verify that Data URIs work correctly in the Node.js environment.
 * This is a critical test case as mentioned in GitHub issue regarding Data URL support.
 *
 * The issue (serratus/quaggaJS#433 referenced) questioned whether Data URLs work in browser.
 * These tests confirm that Data URIs work correctly in Node.js, validating the Data URL
 * handling code in input_stream.ts (lines 58-67).
 */
describe('Data URI Support (Node)', () => {
    /**
     * Test that decodeSingle can process a Data URI containing a barcode image.
     * This validates the Data URL handling in input_stream.ts (lines 58-67).
     */
    describe('decodeSingle with Data URI', () => {
        it('should decode a Code 128 barcode from a Data URI', async function() {
            this.timeout(20000); // Allow time for image processing

            // Read a test image and convert to Data URI
            const imagePath = path.join(__dirname, '../../../../test/fixtures/code_128/image-001.jpg');
            const imageBuffer = fs.readFileSync(imagePath);
            const base64 = imageBuffer.toString('base64');
            const dataUri = `data:image/jpeg;base64,${base64}`;

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

            const result = await Quagga.decodeSingle(config);

            expect(result).to.be.an('Object');
            expect(result.codeResult).to.be.an('Object');
            expect(result.codeResult.code).to.equal('0001285112001000040801');
            expect(result.codeResult.format).to.equal('code_128');
        });

        it('should decode an EAN-13 barcode from a Data URI', async function() {
            this.timeout(20000);

            // Read a test image and convert to Data URI
            const imagePath = path.join(__dirname, '../../../../test/fixtures/ean/image-001.jpg');
            const imageBuffer = fs.readFileSync(imagePath);
            const base64 = imageBuffer.toString('base64');
            const dataUri = `data:image/jpeg;base64,${base64}`;

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

            const result = await Quagga.decodeSingle(config);

            expect(result).to.be.an('Object');
            expect(result.codeResult).to.be.an('Object');
            expect(result.codeResult.code).to.equal('3574660239843');
            expect(result.codeResult.format).to.equal('ean_13');
        });
    });
});
