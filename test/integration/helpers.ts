import Quagga from '../../src/quagga';
import { QuaggaJSConfigObject } from '../../type-definitions/quagga';
import { expect } from 'chai';
import { it as mochaIt } from 'mocha';

// Export our own 'it' with allowFail support
export const it = Object.assign(
    mochaIt,
    {
        allowFail: (title: string, callback: Function) => {
            mochaIt(title, function() {
                return Promise.resolve().then(() => {
                    return callback.apply(this, arguments);
                }).catch((err) => {
                    console.trace('* error during test', title, err);
                    this.skip();
                });
            });
        }
    }
);

export function runDecoderTest(name: string, config: QuaggaJSConfigObject, testSet: Array<{ name: string, result: string, format: string, allowFailInNode?: boolean, allowFailInBrowser?: boolean }>, halfSampleLabel?: string, fixturePath?: string) {
    const testLabel = halfSampleLabel ? `${name} (${halfSampleLabel})` : name;
    const actualFixturePath = fixturePath || name;

    describe(`Decoder ${testLabel}`, () => {
        testSet.forEach((sample) => {
            // Use the flags on the test item as the authoritative source
            const isBrowser = typeof window !== 'undefined';
            const shouldAllowFail = isBrowser ? sample.allowFailInBrowser : sample.allowFailInNode;
            const testFn = shouldAllowFail ? it.allowFail : it;
            testFn(`decodes ${sample.name}`, async function() {
                this.timeout(20000); // need to set a long timeout because laptops sometimes lag like hell in tests when they go low power
                const thisConfig = {
                    ...config,
                    src: `${isBrowser ? '/' : ''}test/fixtures/${actualFixturePath}/${sample.name}`,
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

// Helper function to run decoder tests with both halfSample configurations
export function runDecoderTestBothHalfSample(
    name: string,
    configGenerator: (halfSample: boolean) => QuaggaJSConfigObject,
    testSet: Array<{ name: string, result: string, format: string, allowFailInNode?: boolean, allowFailInBrowser?: boolean }>,
    fixturePath?: string
) {
    describe(`Decoder ${name} (both halfSample configurations)`, () => {
        runDecoderTest(name, configGenerator(true), testSet, 'halfSample: true', fixturePath);
        runDecoderTest(name, configGenerator(false), testSet, 'halfSample: false', fixturePath);
    });
}

// run test that should not fail but no barcode is in the images
export function runNoCodeTest(name: string, config: QuaggaJSConfigObject, testSet: Array<{ name: string, result: string, format: string }>, fixturePath?: string) {
    const actualFixturePath = fixturePath || name;
    describe(`Not decoding ${name}`, () => {
        testSet.forEach((sample) => {
            it(`should run without error (${sample.name})`, async function() {
                this.timeout(20000); // need to set a long timeout because laptops sometimes lag like hell in tests when they go low power
                const thisConfig = {
                    ...config,
                    src: `${typeof window !== 'undefined' ? '/' : ''}test/fixtures/${actualFixturePath}/${sample.name}`,
                };
                const result = await Quagga.decodeSingle(thisConfig);
                expect(result).to.be.an('Object');
                // When multiple: false and no decode found, result should have codeResult.code as null or undefined
                if (result.codeResult) {
                    expect(result.codeResult.code).to.be.null;
                }
                // // console.warn(`* Expect result ${JSON.stringify(result)} to be an object`);
                expect(Quagga.canvas).to.be.an('Object');
                expect(Quagga.canvas.dom).to.be.an('Object');
                expect(Quagga.canvas.ctx).to.be.an('Object');
            });
        });
    });
}

export function generateConfig(configOverride: QuaggaJSConfigObject = {}) {
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
