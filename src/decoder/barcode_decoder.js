/* eslint-disable import/no-cycle */

import ImageDebug from '../common/image_debug';
import TwoOfFiveReader from '../reader/2of5_reader';
import CodabarReader from '../reader/codabar_reader';
import Code128Reader from '../reader/code_128_reader';
import Code32Reader from '../reader/code_32_reader';
import Code39Reader from '../reader/code_39_reader';
import Code39VINReader from '../reader/code_39_vin_reader';
import Code93Reader from '../reader/code_93_reader';
import EAN2Reader from '../reader/ean_2_reader';
import EAN5Reader from '../reader/ean_5_reader';
import EAN8Reader from '../reader/ean_8_reader';
import EANReader from '../reader/ean_reader';
import I2of5Reader from '../reader/i2of5_reader';
import UPCEReader from '../reader/upc_e_reader';
import UPCReader from '../reader/upc_reader';
import Bresenham from './bresenham';

export const READERS = {
    code_128_reader: Code128Reader,
    ean_reader: EANReader,
    ean_5_reader: EAN5Reader,
    ean_2_reader: EAN2Reader,
    ean_8_reader: EAN8Reader,
    code_39_reader: Code39Reader,
    code_39_vin_reader: Code39VINReader,
    codabar_reader: CodabarReader,
    upc_reader: UPCReader,
    upc_e_reader: UPCEReader,
    i2of5_reader: I2of5Reader,
    '2of5_reader': TwoOfFiveReader,
    code_93_reader: Code93Reader,
    code_32_reader: Code32Reader,
};

export default {
    registerReader: (name, reader) => {
        READERS[name] = reader;
    },
    create(config, inputImageWrapper) {
        const _canvas = {
            ctx: {
                frequency: null,
                pattern: null,
                overlay: null,
            },
            dom: {
                frequency: null,
                pattern: null,
                overlay: null,
            },
        };
        const _barcodeReaders = [];

        initCanvas();
        initReaders();
        initConfig();

        function initCanvas() {
            if (ENV.development && typeof document !== 'undefined') {
                const $debug = document.querySelector('#debug.detection');
                _canvas.dom.frequency = document.querySelector('canvas.frequency');
                if (!_canvas.dom.frequency) {
                    _canvas.dom.frequency = document.createElement('canvas');
                    _canvas.dom.frequency.className = 'frequency';
                    if ($debug) {
                        $debug.appendChild(_canvas.dom.frequency);
                    }
                }
                console.warn('* barcode decoder initCanvas getcontext 2d');
                _canvas.ctx.frequency = _canvas.dom.frequency.getContext('2d');

                _canvas.dom.pattern = document.querySelector('canvas.patternBuffer');
                if (!_canvas.dom.pattern) {
                    _canvas.dom.pattern = document.createElement('canvas');
                    _canvas.dom.pattern.className = 'patternBuffer';
                    if ($debug) {
                        $debug.appendChild(_canvas.dom.pattern);
                    }
                }
                _canvas.ctx.pattern = _canvas.dom.pattern.getContext('2d');

                _canvas.dom.overlay = document.querySelector('canvas.drawingBuffer');
                if (_canvas.dom.overlay) {
                    _canvas.ctx.overlay = _canvas.dom.overlay.getContext('2d');
                }
            }
        }

        function initReaders() {
            config.readers.forEach((readerConfig) => {
                let reader;
                let configuration = {};
                let supplements = [];

                if (typeof readerConfig === 'object') {
                    reader = readerConfig.format;
                    configuration = readerConfig.config;
                } else if (typeof readerConfig === 'string') {
                    reader = readerConfig;
                }
                if (ENV.development) {
                    console.log('Before registering reader: ', reader);
                }
                if (configuration.supplements) {
                    supplements = configuration
                        .supplements.map((supplement) => new READERS[supplement]());
                }
                try {
                    const readerObj = new READERS[reader](configuration, supplements);
                    _barcodeReaders.push(readerObj);
                } catch (err) {
                    console.error('* Error constructing reader ', reader, err);
                    throw err;
                }
            });
            if (ENV.development) {
                console.log(`Registered Readers: ${_barcodeReaders
                    .map((reader) => JSON.stringify({ format: reader.FORMAT, config: reader.config }))
                    .join(', ')}`);
            }
        }

        function initConfig() {
            if (ENV.development && typeof document !== 'undefined') {
                let i;
                const vis = [{
                    node: _canvas.dom.frequency,
                    prop: config.debug.showFrequency,
                }, {
                    node: _canvas.dom.pattern,
                    prop: config.debug.showPattern,
                }];

                for (i = 0; i < vis.length; i++) {
                    if (vis[i].prop === true) {
                        vis[i].node.style.display = 'block';
                    } else {
                        vis[i].node.style.display = 'none';
                    }
                }
            }
        }

        /**
         * extend the line on both ends
         * @param {Array} line
         * @param {Number} angle
         */
        function getExtendedLine(line, angle, ext) {
            function extendLine(amount) {
                const extension = {
                    y: amount * Math.sin(angle),
                    x: amount * Math.cos(angle),
                };
                /* eslint-disable no-param-reassign */
                line[0].y -= extension.y;
                line[0].x -= extension.x;
                line[1].y += extension.y;
                line[1].x += extension.x;
                /* eslint-enable no-param-reassign */
            }

            // check if inside image
            extendLine(ext);
            while (ext > 1 && (!inputImageWrapper.inImageWithBorder(line[0])
                    || !inputImageWrapper.inImageWithBorder(line[1]))) {
                // eslint-disable-next-line no-param-reassign
                ext -= Math.ceil(ext / 2);
                extendLine(-ext);
            }
            return line;
        }

        function getLine(box) {
            return [{
                x: (box[1][0] - box[0][0]) / 2 + box[0][0],
                y: (box[1][1] - box[0][1]) / 2 + box[0][1],
            }, {
                x: (box[3][0] - box[2][0]) / 2 + box[2][0],
                y: (box[3][1] - box[2][1]) / 2 + box[2][1],
            }];
        }

        function tryDecode(line) {
            let result = null;
            let i;
            const barcodeLine = Bresenham.getBarcodeLine(inputImageWrapper, line[0], line[1]);

            if (ENV.development && config.debug.showFrequency) {
                ImageDebug.drawPath(line, { x: 'x', y: 'y' }, _canvas.ctx.overlay, { color: 'red', lineWidth: 3 });
                Bresenham.debug.printFrequency(barcodeLine.line, _canvas.dom.frequency);
            }

            Bresenham.toBinaryLine(barcodeLine);

            if (ENV.development && config.debug.showPattern) {
                Bresenham.debug.printPattern(barcodeLine.line, _canvas.dom.pattern);
            }

            for (i = 0; i < _barcodeReaders.length && result === null; i++) {
                result = _barcodeReaders[i].decodePattern(barcodeLine.line);
            }
            if (result === null) {
                return null;
            }
            return {
                codeResult: result,
                barcodeLine,
            };
        }

        /**
         * This method slices the given area apart and tries to detect a barcode-pattern
         * for each slice. It returns the decoded barcode, or null if nothing was found
         * @param {Array} box
         * @param {Array} line
         * @param {Number} lineAngle
         */
        function tryDecodeBruteForce(box, line, lineAngle) {
            const sideLength = Math.sqrt(Math.pow(box[1][0] - box[0][0], 2) + Math.pow((box[1][1] - box[0][1]), 2));
            let i;
            const slices = 16;
            let result = null;
            let dir;
            let extension;
            const xdir = Math.sin(lineAngle);
            const ydir = Math.cos(lineAngle);

            for (i = 1; i < slices && result === null; i++) {
                // move line perpendicular to angle
                // eslint-disable-next-line no-mixed-operators
                dir = sideLength / slices * i * (i % 2 === 0 ? -1 : 1);
                extension = {
                    y: dir * xdir,
                    x: dir * ydir,
                };
                /* eslint-disable no-param-reassign */
                line[0].y += extension.x;
                line[0].x -= extension.y;
                line[1].y += extension.x;
                line[1].x -= extension.y;
                /* eslint-enable no-param-reassign */

                result = tryDecode(line);
            }
            return result;
        }

        function getLineLength(line) {
            return Math.sqrt(
                Math.pow(Math.abs(line[1].y - line[0].y), 2)
                + Math.pow(Math.abs(line[1].x - line[0].x), 2),
            );
        }

        async function decodeFromImage(imageWrapper) {
            let result = null;
            for (const reader of _barcodeReaders) {
                if (reader.decodeImage) {
                    result = await reader.decodeImage(imageWrapper);
                    if (result) {
                        break;
                    }
                }
            }
            return result;
        }
        /**
         * With the help of the configured readers (Code128 or EAN) this function tries to detect a
         * valid barcode pattern within the given area.
         * @param {Object} box The area to search in
         * @returns {Object} the result {codeResult, line, angle, pattern, threshold}
         */
        function decodeFromBoundingBox(box) {
            let line;
            const ctx = _canvas.ctx.overlay;
            let result;

            if (ENV.development) {
                if (config.debug.drawBoundingBox && ctx) {
                    ImageDebug.drawPath(box, { x: 0, y: 1 }, ctx, { color: 'blue', lineWidth: 2 });
                }
            }

            line = getLine(box);
            const lineLength = getLineLength(line);
            const lineAngle = Math.atan2(line[1].y - line[0].y, line[1].x - line[0].x);
            line = getExtendedLine(line, lineAngle, Math.floor(lineLength * 0.1));
            if (line === null) {
                return null;
            }

            result = tryDecode(line);
            if (result === null) {
                result = tryDecodeBruteForce(box, line, lineAngle);
            }

            if (result === null) {
                return null;
            }

            if (ENV.development && result && config.debug.drawScanline && ctx) {
                ImageDebug.drawPath(line, { x: 'x', y: 'y' }, ctx, { color: 'red', lineWidth: 3 });
            }

            return {
                codeResult: result.codeResult,
                line,
                angle: lineAngle,
                pattern: result.barcodeLine.line,
                threshold: result.barcodeLine.threshold,
            };
        }

        return {
            decodeFromBoundingBox(box) {
                return decodeFromBoundingBox(box);
            },
            decodeFromBoundingBoxes(boxes) {
                let i; let result;
                const barcodes = [];
                const { multiple } = config;

                for (i = 0; i < boxes.length; i++) {
                    const box = boxes[i];
                    result = decodeFromBoundingBox(box) || {};
                    result.box = box;

                    if (multiple) {
                        barcodes.push(result);
                    } else if (result.codeResult) {
                        return result;
                    }
                }

                return {
                    barcodes,
                };
            },
            async decodeFromImage(imageWrapperIn) {
                const result = await decodeFromImage(imageWrapperIn);
                return result;
            },
            registerReader(name, reader) {
                if (READERS[name]) {
                    throw new Error('cannot register existing reader', name);
                }
                READERS[name] = reader;
            },
            setReaders(readers) {
                // eslint-disable-next-line no-param-reassign
                config.readers = readers;
                _barcodeReaders.length = 0;
                initReaders();
            },
        };
    },
};
