// TODO: write a test that ensures that Quagga.decodeSingle returns a Promise when it should
// TODO: write a test that tests the multiple: true decoding option, allowing for multiple barcodes in
// a single image to be returned.
// TODO: write a test that allows for locate: false and locator configs to be tested.

import Quagga from '../../src/quagga';
import { expect } from 'chai';
import { runNoCodeTest, generateConfig } from './helpers';



describe('Parallel decoding works', () => {
    it('decodeSingle running in parallel', async () => {
        // TODO: we should throw in some other formats here too.
        const testSet = [
            { 'name': 'image-001.jpg', 'result': '3574660239843', format: 'ean_13' },
            { 'name': 'image-002.jpg', 'result': '8032754490297', format: 'ean_13' },
            { 'name': 'image-004.jpg', 'result': '9002233139084', format: 'ean_13' },
            { 'name': 'image-003.jpg', 'result': '4006209700068', format: 'ean_13' },
            { 'name': 'image-005.jpg', 'result': '8004030044005', format: 'ean_13' },
            { 'name': 'image-006.jpg', 'result': '4003626011159', format: 'ean_13' },
            { 'name': 'image-007.jpg', 'result': '2111220009686', format: 'ean_13' },
            { 'name': 'image-008.jpg', 'result': '9000275609022', format: 'ean_13' },
            { 'name': 'image-009.jpg', 'result': '9004593978587', format: 'ean_13' },
            { 'name': 'image-010.jpg', 'result': '9002244845578', format: 'ean_13' },
        ];
        const promises: Array<Promise<any>> = [];

        testSet.forEach(sample => {
            const config = generateConfig();
            config.src = `${typeof window !== 'undefined' ? '/' : ''}test/fixtures/ean/${sample.name}`;
            promises.push(Quagga.decodeSingle(config));
        });
        const results = await Promise.all(promises).catch((err) => { console.warn('* error decoding simultaneously', err); throw(err); });
        const testResults = testSet.map(x => x.result);
        results.forEach((r, index) => {
            expect(r).to.be.an('object');
            expect(r.codeResult).to.be.an('object');
            expect(r.codeResult.code).to.equal(testResults[index]);
        });
    });
});

describe('Canvas Update Test, avoid DOMException', () => {
    // This test ensures that Quagga handles edge cases with invalid canvas dimensions
    // (NaN width/height) without throwing a DOMException during canvas operations.
    // This is a regression test - the library should gracefully handle invalid dimensions
    // and return an empty result rather than crashing.
    describe('works', () => {
        runNoCodeTest(
            'no_code',
            generateConfig({
                decoder: {
                    readers: ['code_128_reader', 'ean_reader'],
                },
                inputStream: {
                    constraints: {
                        width: NaN,
                        height: NaN
                    },
                    singleChannel: false,
                },
                locate: false,
                locator: {
                    halfSample: true,
                    patchSize: 'x-large'
                }
            }),
            [
                { 'name': 'image-001.jpg', 'result': null, format: 'code_128' },
            ]
        );
    });
});

// Print performance summary after all tests complete
describe('Performance Summary', () => {
    it('should print halfSample performance comparison', function() {
        console.log('\n========== HalfSample Performance Comparison ==========\n');
        
        const decoderNames = Object.keys(timingData).sort();
        
        if (decoderNames.length === 0) {
            console.log('No timing data collected.');
            return;
        }
        
        for (const decoderName of decoderNames) {
            const data = timingData[decoderName];
            const withHalfSample = data.withHalfSample;
            const withoutHalfSample = data.withoutHalfSample;
            
            if (withHalfSample.length === 0 && withoutHalfSample.length === 0) {
                continue;
            }
            
            const avgWith = withHalfSample.length > 0 
                ? (withHalfSample.reduce((a, b) => a + b, 0) / withHalfSample.length).toFixed(2)
                : 'N/A';
            const avgWithout = withoutHalfSample.length > 0
                ? (withoutHalfSample.reduce((a, b) => a + b, 0) / withoutHalfSample.length).toFixed(2)
                : 'N/A';
            
            const passedWith = withHalfSample.length;
            const passedWithout = withoutHalfSample.length;
            
            console.log(`Decoder: ${decoderName}`);
            console.log(`  halfSample: true  - Avg: ${avgWith}ms, Tests passed: ${passedWith}`);
            console.log(`  halfSample: false - Avg: ${avgWithout}ms, Tests passed: ${passedWithout}`);
            
            if (avgWith !== 'N/A' && avgWithout !== 'N/A') {
                const avgWithNum = parseFloat(avgWith);
                const avgWithoutNum = parseFloat(avgWithout);
                const diffPercent = ((avgWithoutNum - avgWithNum) / avgWithoutNum * 100).toFixed(1);
                const diffNum = parseFloat(diffPercent);
                const faster = diffNum > 0 ? 'halfSample: true is faster' : 'halfSample: false is faster';
                console.log(`  Difference: ${Math.abs(diffNum)}% (${faster})`);
            }
            console.log('');
        }
        
        console.log('========== End Performance Summary ==========\n');
    });
});
