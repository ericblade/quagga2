import Quagga from '../../src/quagga';
import { QuaggaJSConfigObject } from '../../type-definitions/quagga';
import { expect } from 'chai';

function runDecoderTest(name: string, config: QuaggaJSConfigObject, testSet: Array<{ name: string, result: string, format: string }>) {
    describe(`Decoder ${name}`, () => {
        testSet.forEach((sample) => {
            it(`decodes ${sample.name}`, async function() {
                const thisConfig = {
                    ...config,
                    src: `${typeof window !== 'undefined' ? '/' : ''}test/fixtures/${name}/${sample.name}`,
                };
                const result = await Quagga.decodeSingle(thisConfig);
                // // console.warn(`* Expect result ${JSON.stringify(result)} to be an object`);
                expect(result).to.be.an('Object');
                expect(result.codeResult).to.be.an('Object');
                expect(result.codeResult.code).to.equal(sample.result);
                expect(result.codeResult.format).to.equal(sample.format);
                expect(Quagga.canvas).to.be.an('Object');
                expect(Quagga.canvas.dom).to.be.an('Object');
                expect(Quagga.canvas.ctx).to.be.an('Object');
            });
        });
    });
}

describe('End-To-End Decoder Tests', () => {
    runDecoderTest('ean', {
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
        src: null,
    }, [
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
    ]);
});