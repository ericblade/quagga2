import Quagga from '../../../src/quagga';
import { expect } from 'chai';
import { it } from '../helpers';

describe('EAN Supplement Format Tests', () => {
    // Test that verifies the supplement format is correctly returned as 'ean_2' or 'ean_5'
    // rather than inheriting the parent 'ean_13' format
    
    const baseConfig = {
        inputStream: {
            size: 800,
            singleChannel: false,
        },
        locator: {
            patchSize: 'medium' as const,
            halfSample: false,
        },
        numOfWorkers: 0,
        decoder: {
            readers: [{
                format: 'ean_reader',
                config: {
                    supplements: [
                        'ean_5_reader',
                        'ean_2_reader',
                    ],
                },
            }],
        },
    };
    
    it('should return ean_2 format for 2-digit supplement', async function() {
        this.timeout(30000);
        
        const isBrowser = typeof window !== 'undefined';
        const config = {
            ...baseConfig,
            src: `${isBrowser ? '/' : ''}test/fixtures/ean_extended/image-002.jpg`, // EAN-13 with 2-digit supplement
        };
        
        const result = await Quagga.decodeSingle(config);
        
        expect(result).to.be.an('Object');
        expect(result.codeResult).to.be.an('Object');
        expect(result.codeResult.format).to.equal('ean_13');
        expect(result.codeResult.supplement).to.be.an('Object');
        expect(result.codeResult.supplement.format).to.equal('ean_2');
        expect(result.codeResult.supplement.code).to.equal('01');
    });
    
    it('should return ean_5 format for 5-digit supplement', async function() {
        this.timeout(30000);
        
        const isBrowser = typeof window !== 'undefined';
        const config = {
            ...baseConfig,
            src: `${isBrowser ? '/' : ''}test/fixtures/ean_extended/image-004.jpg`, // EAN-13 with 5-digit supplement
        };
        
        const result = await Quagga.decodeSingle(config);
        
        expect(result).to.be.an('Object');
        expect(result.codeResult).to.be.an('Object');
        expect(result.codeResult.format).to.equal('ean_13');
        expect(result.codeResult.supplement).to.be.an('Object');
        expect(result.codeResult.supplement.format).to.equal('ean_5');
        expect(result.codeResult.supplement.code).to.equal('52495');
    });
});
