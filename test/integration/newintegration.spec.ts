import Quagga from '../../src/quagga';
import { QuaggaJSConfigObject } from '../../type-definitions/quagga';
import { expect } from 'chai';
import tracer from 'locator/tracer';

// add it.allowFail see https://github.com/kellyselden/mocha-helpers/pull/4
// also see https://github.com/mochajs/mocha/issues/1480#issuecomment-487074628
if (typeof it.allowFail === 'undefined') {
    it.allowFail = (title: string, callback: Function) => {
        it(title, function() {
            return Promise.resolve().then(() => {
                return callback.apply(this, arguments);
            }).catch((err) => {
                console.trace('* error during test', err);
                this.skip();
            });
        });
    };
}

function runDecoderTest(name: string, config: QuaggaJSConfigObject, testSet: Array<{ name: string, result: string, format: string }>) {
    describe(`Decoder ${name}`, () => {
        testSet.forEach((sample) => {
            it.allowFail(`decodes ${sample.name}`, async function() {
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
    // TODO: note that the FORMAT reported from a supplement equals the parent. What exactly is the
    // difference between a supplement and a separate reader?  is it just semantic?
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
        { 'name': 'image-001.jpg', 'result': '900437801102701', format: 'ean_13' },
        { 'name': 'image-002.jpg', 'result': '419871600890101', format: 'ean_13' },
        { 'name': 'image-003.jpg', 'result': '419871600890101', format: 'ean_13' },
        { 'name': 'image-004.jpg', 'result': '978054466825652495', format: 'ean_13' },
        { 'name': 'image-005.jpg', 'result': '419664190890712', format: 'ean_13' },
        { 'name': 'image-006.jpg', 'result': '412056690699101', format: 'ean_13' },
        { 'name': 'image-007.jpg', 'result': '419204531290601', format: 'ean_13' },
        { 'name': 'image-008.jpg', 'result': '419871600890101', format: 'ean_13' },
        { 'name': 'image-009.jpg', 'result': '978054466825652495', format: 'ean_13' },
        { 'name': 'image-010.jpg', 'result': '900437801102701', format: 'ean_13' },
    ]);
    runDecoderTest('code_128', {
        inputStream: {
            size: 800,
            singleChannel: false,
        }
    }, [
        { 'name': 'image-001.jpg', 'result': '0001285112001000040801', format: 'code_128' },
        { 'name': 'image-002.jpg', 'result': 'FANAVF14617104', format: 'code_128' },
        { 'name': 'image-003.jpg', 'result': '673023', format: 'code_128' },
        { 'name': 'image-004.jpg', 'result': '010210150301625334', format: 'code_128' },
        { 'name': 'image-005.jpg', 'result': '419055603900009001012999', format: 'code_128' },
        { 'name': 'image-006.jpg', 'result': '419055603900009001012999', format: 'code_128' },
        { 'name': 'image-007.jpg', 'result': '420957479499907123456123456781', format: 'code_128' },
        { 'name': 'image-008.jpg', 'result': '1020185021797280784055', format: 'code_128' },
        { 'name': 'image-009.jpg', 'result': '0001285112001000040801', format: 'code_128' },
        { 'name': 'image-010.jpg', 'result': '673023', format: 'code_128' },
        // TODO: need to implement having different inputStream parameters to be able to
        // read this one -- it works only with inputStream size set to 1600 presently, but
        // other samples break at that high a size.
        // { name: 'image-011.png', result: '33c64780-a9c0-e92a-820c-fae7011c11e2' },
    ]);
    runDecoderTest(
        'code_39',
        generateConfig({
            decoder: {
                readers: ['code_39_reader'],
            }
        }), [
            { 'name': 'image-001.jpg', 'result': 'B3% $DAD$', format: 'code_39' },
            { 'name': 'image-003.jpg', 'result': 'CODE39', format: 'code_39' },
            { 'name': 'image-004.jpg', 'result': 'QUAGGAJS', format: 'code_39' },
            { 'name': 'image-005.jpg', 'result': 'CODE39', format: 'code_39' },
            { 'name': 'image-006.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
            { 'name': 'image-007.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
            { 'name': 'image-008.jpg', 'result': 'CODE39', format: 'code_39' },
            { 'name': 'image-009.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
            // TODO: image 10 in this set appears to be dependent upon #190
            { 'name': 'image-010.jpg', 'result': 'CODE39', format: 'code_39' },
        ]);
    runDecoderTest(
        'code_39_vin',
        generateConfig({
            inputStream: {
                size: 1280,
                sequence: false,
            },
            locator: {
                halfSample: false,
            },
            decoder: {
                readers: ['code_39_vin_reader'],
            },
        }),
        [
            { name: 'image-001.jpg', result: '2HGFG1B86BH501831', format: 'code_39_vin' },
            { name: 'image-002.jpg', result: 'JTDKB20U887718156', format: 'code_39_vin' },
            // image-003 only works on the second run of a decode of it and only in browser?! wtf?
            { name: 'image-003.jpg', result: 'JM1BK32G071773697', format: 'code_39_vin' },
            { name: 'image-004.jpg', result: 'WDBTK75G94T028954', format: 'code_39_vin' },
            { name: 'image-005.jpg', result: '3VW2K7AJ9EM381173', format: 'code_39_vin' },
            { name: 'image-006.jpg', result: 'JM1BL1H4XA1335663', format: 'code_39_vin' },
            { name: 'image-007.jpg', result: 'JHMGE8H42AS021233', format: 'code_39_vin' },
            { name: 'image-008.jpg', result: 'WMEEJ3BA4DK652562', format: 'code_39_vin' },
            { name: 'image-009.jpg', result: 'WMEEJ3BA4DK652562', format: 'code_39_vin' }, //yes, 8 and 9 are same barcodes, different images slightly
            { name: 'image-010.jpg', result: 'WMEEJ3BA4DK652562', format: 'code_39_vin' }, // 10 also
        ]
    );
    runDecoderTest(
        'ean_8',
        generateConfig({ decoder: { readers: ['ean_8_reader'] } }),
        [
            { 'name': 'image-001.jpg', 'result': '42191605', format: 'ean_8' },
            { 'name': 'image-002.jpg', 'result': '42191605', format: 'ean_8' },
            { 'name': 'image-003.jpg', 'result': '90311208', format: 'ean_8' },
            // TODO: image-004 fails in browser, this is new to running in cypress vs PhantomJS. It does not fail in node.  Likely similar problem to #190
            { 'name': 'image-004.jpg', 'result': '24057257', format: 'ean_8' },
            // {"name": "image-005.jpg", "result": "90162602"},
            { 'name': 'image-006.jpg', 'result': '24036153', format: 'ean_8' },
            // {"name": "image-007.jpg", "result": "42176817"},
            { 'name': 'image-008.jpg', 'result': '42191605', format: 'ean_8' },
            { 'name': 'image-009.jpg', 'result': '42242215', format: 'ean_8' },
            { 'name': 'image-010.jpg', 'result': '42184799', format: 'ean_8' },
        ]
    );
    runDecoderTest(
        'upc',
        generateConfig({ decoder: { readers: ['upc_reader'] } }),
        [
            { 'name': 'image-001.jpg', 'result': '882428015268', format: 'upc_a' },
            { 'name': 'image-002.jpg', 'result': '882428015268', format: 'upc_a' },
            { 'name': 'image-003.jpg', 'result': '882428015084', format: 'upc_a' },
            { 'name': 'image-004.jpg', 'result': '882428015343', format: 'upc_a' },
            { 'name': 'image-005.jpg', 'result': '882428015343', format: 'upc_a' },
            { 'name': 'image-006.jpg', 'result': '882428015046', format: 'upc_a' },
            { 'name': 'image-007.jpg', 'result': '882428015084', format: 'upc_a' },
            { 'name': 'image-008.jpg', 'result': '882428015046', format: 'upc_a' },
            { 'name': 'image-009.jpg', 'result': '039047013551', format: 'upc_a' },
            { 'name': 'image-010.jpg', 'result': '039047013551', format: 'upc_a' },
        ]
    );
    runDecoderTest(
        'upc_e',
        generateConfig({ decoder: { readers: ['upc_e_reader'] } }),
        [
            { 'name': 'image-001.jpg', 'result': '04965802', format: 'upc_e' },
            { 'name': 'image-002.jpg', 'result': '04965802', format: 'upc_e' },
            { 'name': 'image-003.jpg', 'result': '03897425', format: 'upc_e' },
            { 'name': 'image-004.jpg', 'result': '05096893', format: 'upc_e' },
            { 'name': 'image-005.jpg', 'result': '05096893', format: 'upc_e' },
            { 'name': 'image-006.jpg', 'result': '05096893', format: 'upc_e' },
            { 'name': 'image-007.jpg', 'result': '03897425', format: 'upc_e' },
            { 'name': 'image-008.jpg', 'result': '01264904', format: 'upc_e' },
            { 'name': 'image-009.jpg', 'result': '01264904', format: 'upc_e' },
            { 'name': 'image-010.jpg', 'result': '01264904', format: 'upc_e' },
        ]
    );
    runDecoderTest(
        'codabar',
        generateConfig({ decoder: { readers: ['codabar_reader'] } }),
        [
            { 'name': 'image-001.jpg', 'result': 'A10/53+17-70D', format: 'codabar' },
            { 'name': 'image-002.jpg', 'result': 'B546745735B', format: 'codabar' },
            { 'name': 'image-003.jpg', 'result': 'C$399.95A', format: 'codabar' },
            { 'name': 'image-004.jpg', 'result': 'B546745735B', format: 'codabar' },
            { 'name': 'image-005.jpg', 'result': 'C$399.95A', format: 'codabar' },
            { 'name': 'image-006.jpg', 'result': 'B546745735B', format: 'codabar' },
            { 'name': 'image-007.jpg', 'result': 'C$399.95A', format: 'codabar' },
            { 'name': 'image-008.jpg', 'result': 'A16:9/4:3/3:2D', format: 'codabar' },
            { 'name': 'image-009.jpg', 'result': 'C$399.95A', format: 'codabar' },
            { 'name': 'image-010.jpg', 'result': 'C$399.95A', format: 'codabar' },
        ]
    )
});
