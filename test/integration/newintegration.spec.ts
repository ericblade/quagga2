import Quagga from '../../src/quagga';
import { QuaggaJSConfigObject } from '../../type-definitions/quagga';
import { expect } from 'chai';

function runDecoderTest(name: string, config: QuaggaJSConfigObject, testSet: Array<{ name: string, result: string, format: string }>) {
    describe(`Decoder ${name}`, () => {
        testSet.forEach((sample) => {
            it(`decodes ${sample.name}`, async function() {
                this.timeout(20000); // need to set a long timeout because laptops sometimes lag like hell in tests when they go low power
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

function generateConfig(configOverride: QuaggaJSConfigObject = {}) {
    const config: QuaggaJSConfigObject = {
        inputStream: {
            size: 640,
            ...configOverride.inputStream,
        },
        locator: {
            patchSize: 'medium',
            halfSample: true,
            ...configOverride.locator,
        },
        numOfWorkers: 0,
        decoder: {
            readers: ['ean_reader'],
            ...configOverride.decoder,
        },
        locate: configOverride.locate,
        src: null,
    };
    return config;
}

describe.only('End-To-End Decoder Tests', () => {
    runDecoderTest('ean', generateConfig(), [
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
    runDecoderTest('ean_extended', generateConfig({
        inputStream: {
            size: 800,
            singleChannel: false,
        },
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
    }), [
        // // {"name": "image-001.jpg", "result": "900437801102701"},
        { 'name': 'image-002.jpg', 'result': '419871600890101', format: 'ean_13' },
        // // {"name": "image-003.jpg", "result": "419871600890101", format: 'ean_13' },
        { 'name': 'image-004.jpg', 'result': '978054466825652495', format: 'ean_13' },
        { 'name': 'image-005.jpg', 'result': '419664190890712', format: 'ean_13' },
        // {"name": "image-006.jpg", "result": "412056690699101", format: 'ean_13' },
        { 'name': 'image-007.jpg', 'result': '419204531290601', format: 'ean_13' },
        { 'name': 'image-008.jpg', 'result': '419871600890101', format: 'ean_13' },
        { 'name': 'image-009.jpg', 'result': '978054466825652495', format: 'ean_13' },
        { 'name': 'image-010.jpg', 'result': '900437801102701', format: 'ean_13' },
    ]);
});