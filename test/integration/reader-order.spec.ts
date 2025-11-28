/**
 * Tests to verify that barcode readers are processed in the order specified
 * in the configuration. This is important for predictable decoding behavior.
 * 
 * Key findings about reader order:
 * 1. Internal readers (code_128_reader, ean_reader, etc.) are processed in the 
 *    order they appear in the `readers` config array
 * 2. External readers must be registered via `Quagga.registerReader()` BEFORE 
 *    they can be used in the `readers` array
 * 3. The position of a reader in the `readers` array determines when it attempts
 *    to decode (earlier = higher priority)
 * 4. The first reader to successfully decode the barcode wins
 */

import Quagga from '../../src/quagga';
import { expect } from 'chai';

/**
 * Helper function to construct fixture paths consistently across browser and Node environments
 */
function getFixturePath(folder: string, filename: string): string {
    const prefix = typeof window !== 'undefined' ? '/' : '';
    return `${prefix}test/fixtures/${folder}/${filename}`;
}

describe('Priority Behavior with Multiple Readers', () => {
    it('should decode EAN-8 as ean_8 when ean_8_reader is prioritized over ean_reader', async function() {
        this.timeout(20000);
        
        // This test uses an EAN-8 barcode image (8 digits)
        // When ean_8_reader is listed first, it should decode as ean_8
        const config = {
            inputStream: {
                size: 640,
            },
            locator: {
                patchSize: 'large',
                halfSample: true,
            },
            numOfWorkers: 0,
            decoder: {
                // EAN-8 reader first - should decode EAN-8 barcodes as ean_8
                readers: ['ean_8_reader', 'ean_reader'],
            },
            locate: true,
            src: getFixturePath('ean_8', 'image-001.jpg'),
        };
        
        const result = await Quagga.decodeSingle(config);
        
        expect(result).to.be.an('object');
        expect(result.codeResult).to.be.an('object');
        expect(result.codeResult.code).to.equal('42191605');
        expect(result.codeResult.format).to.equal('ean_8');
    });
    
    it('should fallback to ean_8_reader when ean_reader cannot decode EAN-8 barcode', async function() {
        this.timeout(20000);
        
        // EAN-8 and EAN-13 are different barcode formats with different structures.
        // The EAN-13 reader will not successfully decode an EAN-8 barcode,
        // so it will return null and the decoder will try the next reader.
        // This test demonstrates that reader order affects fallback behavior.
        const config = {
            inputStream: {
                size: 640,
            },
            locator: {
                patchSize: 'large',
                halfSample: true,
            },
            numOfWorkers: 0,
            decoder: {
                // EAN-13 reader first, EAN-8 as fallback
                readers: ['ean_reader', 'ean_8_reader'],
            },
            locate: true,
            src: getFixturePath('ean_8', 'image-001.jpg'),
        };
        
        const result = await Quagga.decodeSingle(config);
        
        // EAN-13 reader cannot decode EAN-8, so EAN-8 reader succeeds as fallback
        expect(result).to.be.an('object');
        expect(result.codeResult).to.be.an('object');
        expect(result.codeResult.code).to.equal('42191605');
        // Since EAN-13 reader fails, the EAN-8 reader handles it
        expect(result.codeResult.format).to.equal('ean_8');
    });
});
