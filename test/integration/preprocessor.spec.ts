import Quagga from '../../src/quagga';
import { expect } from 'chai';

describe('Preprocessor Integration Tests', () => {
    describe('addBorder preprocessor with no-whitespace barcode', () => {
        const expectedCode = '439393900039990260001000000000000000000000123123220412';
        // Use leading slash for browser (Cypress) environment
        const barcodePath = `${typeof window !== 'undefined' ? '/' : ''}test/fixtures/preprocessors/whitespace/no-whitespace-barcode.gif`;

        it('should fail to decode barcode without preprocessor', async function() {
            this.timeout(20000);
            
            const result = await Quagga.decodeSingle({
                src: barcodePath,
                inputStream: {
                    type: 'ImageStream',
                    size: 800,
                    mime: 'image/gif',
                },
                decoder: {
                    readers: ['code_128_reader'],
                },
                locate: true,
                locator: {
                    halfSample: false,
                    patchSize: 'medium',
                },
            });

            // Without the preprocessor, the barcode should NOT be decoded
            // because it has no quiet zone (whitespace) around it
            expect(result.codeResult?.code).to.not.equal(expectedCode);
        });

        it('should successfully decode barcode with addBorder preprocessor', async function() {
            this.timeout(20000);
            
            // Border size of 20 works well for this barcode
            // (tested: 10 too small, 20-30 works, 50 too large)
            const result = await Quagga.decodeSingle({
                src: barcodePath,
                inputStream: {
                    type: 'ImageStream',
                    size: 800,
                    mime: 'image/gif',
                },
                decoder: {
                    readers: ['code_128_reader'],
                },
                locate: true,
                locator: {
                    halfSample: false,
                    patchSize: 'medium',
                },
                preprocessors: [Quagga.Preprocessors.addBorder(20)],
            });

            // With the addBorder preprocessor, the barcode should be decoded
            expect(result).to.be.an('object');
            expect(result.codeResult).to.be.an('object');
            expect(result.codeResult.code).to.equal(expectedCode);
            expect(result.codeResult.format).to.equal('code_128');
        });
    });
});
