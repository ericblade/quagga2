const Quagga = require('../../src/quagga').default;
// const async = require('async');
const Code128Reader = require('../../src/reader/code_128_reader');

Quagga.registerReader('external_code_128_reader', Code128Reader.default);

describe('decodeSingle', function () {
    var baseFolder = 'base/test/fixtures/';

    function generateConfig() {
        return {
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
        };
    }

    this.timeout(20000);

    function _runTestSet(testSet, config, formatOverride) {
        var readers = config.decoder.readers.slice(),
            format,
            folder,
            suffix;

        if (typeof readers[0] === 'string'){
            format = readers[0];
        } else {
            if (readers[0].config && readers[0].config.supplements && readers[0].config.supplements.length) {
                suffix = 'extended';
            }
            format = readers[0].format;
        }
        if (formatOverride) {
            format = formatOverride;
        }

        folder = baseFolder + format.split('_').slice(0, -1).concat(suffix ? [suffix] : []).join('_') + '/';

        function testFactory(sample) {
            return () => {
                return new Promise((resolve) => {
                    const thisConfig = {
                        ...config,
                        src: folder + sample.name,
                        readers,
                    };
                    console.log('Decoding', sample.name);
                    Quagga.decodeSingle(thisConfig, (result) => {
                        // console.warn(`* Expect result ${JSON.stringify(result)} to be an object`);
                        expect(result).to.be.an('Object');
                        // console.warn('* Expect codeResult to be an object');
                        expect(result.codeResult).to.be.an('Object');
                        // console.warn(`* Expect ${result.codeResult.code} to equal ${sample.result}`);
                        expect(result.codeResult.code).to.equal(sample.result);
                        // console.warn(`* Expect ${result.codeResult.format} to equal ${sample.format}`);
                        expect(result.codeResult.format).to.equal(sample.format);
                        // console.warn(`* Expect Quagga.canvas to be an object ${Quagga.canvas}`);
                        expect(Quagga.canvas).to.be.an('Object');
                        // console.warn(`* Expect Quagga.canvas.dom to be an object ${Quagga.canvas.dom}`);
                        expect(Quagga.canvas.dom).to.be.an('Object');
                        // console.warn(`* Expect Quagga.canvas.ctx to be an object ${Quagga.canvas.ctx}`);
                        expect(Quagga.canvas.ctx).to.be.an('Object');
                        // In prior versions, calling decodeSingle was enough to setup the canvas
                        // variables, that is no longer the case now that decodeSingle() works on
                        // multiple instances.
                        // console.warn(`* Expect Quagga.canvas.ctx.overlay to be a CanvasRenderingContext2D ${Quagga.canvas.ctx.overlay}`);
                        // expect(Quagga.canvas.ctx.overlay).to.be.an('CanvasRenderingContext2D');
                        resolve(result);
                    });
                });
            };
        }

        it('should decode ' + folder + ' correctly', function() {
            const promises = testSet.map(sample => testFactory(sample));
            return promises.reduce((promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]));
        });
    }

    // TODO: I kind of hate how this test is structured, but the existing setup does work, so i just copied it instead of trying to untangle it
    function _runTestsInParallel(testSet, config, formatOverride) {
        const readers = config.decoder.readers.slice();
        let format;
        let folder;
        let suffix;
        if (typeof readers[0] === 'string') {
            format = readers[0];
        } else {
            if (readers[0].config && readers[0].config.supplements && readers[0].config.supplements.length) {
                suffix = 'extended';
            }
            format = readers[0].format;
        }
        if (formatOverride) {
            format = formatOverride;
        }
        folder = baseFolder + format.split('_').slice(0, -1).concat(suffix ? [suffix] : []).join('_') + '/';
        it('decoding multiple EANs simultaneously returns correct results', async () => {
            const promises = [];
            testSet.forEach(sample => {
                config.src = folder + sample.name;
                config.readers = readers;
                promises.push(Quagga.decodeSingle(config));
            });
            const results = await Promise.all(promises).catch((err) => { console.warn('*** Error in test', err); throw(err); });
            const testResults = testSet.map(x => x.result);
            results.forEach((r, index) => {
                // console.warn(`* expect r to be an object ${r}`);
                expect(r).to.be.an('object');
                // console.warn(`* expect r.codeResult to be an object ${r.codeResult}`);
                expect(r.codeResult).to.be.an('object');
                // console.warn(`* expect r.codeResult.code to equal ${r.codeResult.code} ${testResults[index]}`);
                expect(r.codeResult.code).to.equal(testResults[index]);
            });
        });
    }

    describe('Simultaneous calls to decodeSingle return correct results', () => {
        const config = generateConfig();
        const testSet = [
            {'name': 'image-001.jpg', 'result': '3574660239843'},
            {'name': 'image-002.jpg', 'result': '8032754490297'},
        ];
        testSet.forEach((sample) => sample.format = 'ean_13');
        config.decoder.readers = ['ean_reader'];
        _runTestsInParallel(testSet, config);
    });

    // TODO: write a test that tests Promise return/resolve

    describe('Code128 run as external', function() {
        var config = {
                inputStream: {
                    size: 800,
                    singleChannel: false,
                },
                locator: {
                    patchSize: 'medium',
                    halfSample: true,
                },
                numOfWorkers: 0,
                decoder: {
                    readers: ['external_code_128_reader'],
                },
                locate: true,
                src: null,
            },
            testSet = [
                {'name': 'image-001.jpg', 'result': '0001285112001000040801'},
                {'name': 'image-002.jpg', 'result': 'FANAVF14617104'},
                {'name': 'image-003.jpg', 'result': '673023'},
                {'name': 'image-004.jpg', 'result': '010210150301625334'},
                {'name': 'image-005.jpg', 'result': '419055603900009001012999'},
                {'name': 'image-006.jpg', 'result': '419055603900009001012999'},
                {'name': 'image-007.jpg', 'result': '420957479499907123456123456781'},
                {'name': 'image-008.jpg', 'result': '1020185021797280784055'},
                {'name': 'image-009.jpg', 'result': '0001285112001000040801'},
                {'name': 'image-010.jpg', 'result': '673023'},
                // TODO: need to implement having different inputStream parameters to be able to
                // read this one -- it works only with inputStream size set to 1600 presently, but
                // other samples break at that high a size.
                // { name: 'image-011.png', result: '33c64780-a9c0-e92a-820c-fae7011c11e2' },
            ];

        testSet.forEach(function(sample) {
            sample.format = 'code_128';
        });

        config.decoder.readers = ['external_code_128_reader'];
        _runTestSet(testSet, config, 'code_128_reader');
    });

    describe('Codabar', function() {
        var config = generateConfig(),
            testSet = [
                {'name': 'image-001.jpg', 'result': 'A10/53+17-70D'},
                {'name': 'image-002.jpg', 'result': 'B546745735B'},
                {'name': 'image-003.jpg', 'result': 'C$399.95A'},
                {'name': 'image-004.jpg', 'result': 'B546745735B'},
                {'name': 'image-005.jpg', 'result': 'C$399.95A'},
                {'name': 'image-006.jpg', 'result': 'B546745735B'},
                {'name': 'image-007.jpg', 'result': 'C$399.95A'},
                // {"name": "image-008.jpg", "result": "A16:9/4:3/3:2D"},
                {'name': 'image-009.jpg', 'result': 'C$399.95A'},
                {'name': 'image-010.jpg', 'result': 'C$399.95A'},
            ];

        testSet.forEach(function(sample) {
            sample.format = 'codabar';
        });

        config.decoder.readers = ['codabar_reader'];
        _runTestSet(testSet, config);
    });

    describe('I2of5 with localization', function() {
        var config = {
                inputStream: {
                    size: 800,
                    singleChannel: false,
                },
                locator: {
                    patchSize: 'small',
                    halfSample: false,
                },
                numOfWorkers: 0,
                decoder: {
                    readers: ['i2of5_reader'],
                },
                locate: true,
                src: null,
            },
            testSet = [
                {'name': 'image-001.jpg', 'result': '2167361334'},
                {'name': 'image-002.jpg', 'result': '2167361334'},
                {'name': 'image-003.jpg', 'result': '2167361334'},
                {'name': 'image-004.jpg', 'result': '2167361334'},
                {'name': 'image-005.jpg', 'result': '2167361334'},
            ];
        testSet.forEach(function(sample) {
            sample.format = 'i2of5';
        });
        _runTestSet(testSet, config);
    });

    describe('2of5', function() {
        var config = {
                inputStream: {
                    size: 800,
                    singleChannel: false,
                },
                locator: {
                    patchSize: 'medium',
                    halfSample: true,
                },
                numOfWorkers: 0,
                decoder: {
                    readers: ['2of5_reader'],
                },
                locate: true,
                src: null,
            },
            testSet = [
                {'name': 'image-001.jpg', 'result': '9577149002'},
                {'name': 'image-002.jpg', 'result': '9577149002'},
                {'name': 'image-003.jpg', 'result': '5776158811'},
                {'name': 'image-004.jpg', 'result': '0463381455'},
                {'name': 'image-005.jpg', 'result': '3261594101'},
                {'name': 'image-006.jpg', 'result': '3261594101'},
                {'name': 'image-007.jpg', 'result': '3261594101'},
                {'name': 'image-008.jpg', 'result': '6730705801'},
                {'name': 'image-009.jpg', 'result': '5776158811'},
                {'name': 'image-010.jpg', 'result': '5776158811'},
            ];

        testSet.forEach(function(sample) {
            sample.format = '2of5';
        });

        _runTestSet(testSet, config);
    });

    describe('code_93', function() {
        var config = {
                inputStream: {
                    size: 800,
                    singleChannel: false,
                },
                locator: {
                    patchSize: 'large',
                    halfSample: true,
                },
                numOfWorkers: 0,
                decoder: {
                    readers: ['code_93_reader'],
                },
                locate: true,
                src: null,
            },
            testSet = [
                {'name': 'image-001.jpg', 'result': 'WIWV8ETQZ1'},
                {'name': 'image-002.jpg', 'result': 'EH3C-%GU23RK3'},
                {'name': 'image-003.jpg', 'result': 'O308SIHQOXN5SA/PJ'},
                {'name': 'image-004.jpg', 'result': 'DG7Q$TV8JQ/EN'},
                {'name': 'image-005.jpg', 'result': 'DG7Q$TV8JQ/EN'},
                {'name': 'image-006.jpg', 'result': 'O308SIHQOXN5SA/PJ'},
                {'name': 'image-007.jpg', 'result': 'VOFD1DB5A.1F6QU'},
                {'name': 'image-008.jpg', 'result': 'WIWV8ETQZ1'},
                {'name': 'image-009.jpg', 'result': '4SO64P4X8 U4YUU1T-'},
                {'name': 'image-010.jpg', 'result': '4SO64P4X8 U4YUU1T-'},
            ];

        testSet.forEach(function(sample) {
            sample.format = 'code_93';
        });

        _runTestSet(testSet, config);
    });
});
