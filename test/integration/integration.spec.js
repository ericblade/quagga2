const Quagga = require('../../src/quagga').default;
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

});
