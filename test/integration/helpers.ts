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

                // Debug: save processed image for image-016
                if (sample.name.includes('image-016') && typeof require !== 'undefined') {
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const debugDir = path.join(process.cwd(), 'debug-pharmacode');
                        if (!fs.existsSync(debugDir)) {
                            fs.mkdirSync(debugDir, { recursive: true });
                        }

                        // Get the processed canvas data
                        if (Quagga.canvas && Quagga.canvas.dom && Quagga.canvas.dom.image) {
                            const canvas = Quagga.canvas.dom.image;
                            const ctx = canvas.getContext('2d');
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                            // Convert to grayscale PGM
                            const width = imageData.width;
                            const height = imageData.height;
                            const pgmHeader = `P5\n${width} ${height}\n255\n`;
                            const grayData = Buffer.alloc(width * height);

                            for (let i = 0; i < width * height; i++) {
                                const r = imageData.data[i * 4];
                                const g = imageData.data[i * 4 + 1];
                                const b = imageData.data[i * 4 + 2];
                                grayData[i] = Math.floor((r + g + b) / 3);
                            }

                            const fullData = Buffer.concat([Buffer.from(pgmHeader, 'ascii'), grayData]);
                            const filename = path.join(debugDir, `full-image-016-${canvas.width}x${canvas.height}.pgm`);
                            fs.writeFileSync(filename, fullData);
                            console.log(`[DEBUG] Saved full processed image to ${filename}`);
                        }
                    } catch (err) {
                        console.error('[DEBUG] Failed to save full image:', err);
                    }
                }

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
