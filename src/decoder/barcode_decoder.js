/* eslint-disable import/no-cycle */

/**
 * Barcode Decoder Module
 *
 * This module handles the decoding of barcodes using configured readers.
 *
 * READER ORDER GUARANTEE:
 * Readers are processed in the exact order they are specified in the `readers`
 * config array. The first reader to successfully decode the barcode wins.
 *
 * Example:
 *   readers: ['ean_reader', 'upc_e_reader', 'code_128_reader']
 *
 * Decoding order:
 *   1. ean_reader attempts to decode
 *   2. If ean_reader returns null, upc_e_reader attempts to decode
 *   3. If upc_e_reader returns null, code_128_reader attempts to decode
 *   4. First non-null result is returned
 *
 * EXTERNAL READERS:
 * External readers must be registered via registerReader() before use.
 * Once registered, they follow the same ordering rules as built-in readers.
 * Their position in the `readers` array determines their priority.
 *
 * To prioritize an external reader:
 *   Quagga.registerReader('my_reader', MyReader);
 *   config.decoder.readers = ['my_reader', 'ean_reader']; // my_reader tried first
 */

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
import PharmacodeReader from '../reader/pharmacode_reader';
import UPCEReader from '../reader/upc_e_reader';
import UPCReader from '../reader/upc_reader';
import Bresenham from './bresenham';

const READERS = {
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
    pharmacode_reader: PharmacodeReader,
};

export default {
    /**
     * Registers an external/custom barcode reader.
     * Once registered, the reader can be used in config.readers array.
     * The reader's position in config.readers determines its decoding priority.
     *
     * @param name - The identifier to use in config.readers (e.g., 'my_custom_reader')
     * @param reader - The reader class (must extend BarcodeReader)
     *
     * @example
     * // Register a custom reader
     * BarcodeDecoder.registerReader('my_reader', MyCustomReader);
     *
     * // Use it with high priority (first in array)
     * config.decoder.readers = ['my_reader', 'ean_reader', 'code_128_reader'];
     */
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
            if (typeof ENV !== 'undefined' && ENV.development && typeof document !== 'undefined') {
                const $debug = document.querySelector('#debug.detection');
                _canvas.dom.frequency = document.querySelector('canvas.frequency');
                if (!_canvas.dom.frequency) {
                    _canvas.dom.frequency = document.createElement('canvas');
                    _canvas.dom.frequency.className = 'frequency';
                    if ($debug) {
                        $debug.appendChild(_canvas.dom.frequency);
                    }
                }
                if (typeof ENV !== 'undefined' && ENV.development && config.debug?.printReaderInfo) {
                    console.warn('* barcode decoder initCanvas getcontext 2d');
                }
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

        /**
         * Initializes barcode readers from config.readers array.
         * Readers are instantiated and stored in the order they appear in config,
         * which determines their decoding priority (first in array = highest priority).
         */
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
                if (typeof ENV !== 'undefined' && ENV.development && config.debug?.printReaderInfo) {
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
            if (typeof ENV !== 'undefined' && ENV.development && config.debug?.printReaderInfo) {
                console.log(`Registered Readers: ${_barcodeReaders
                    .map((reader) => JSON.stringify({ format: reader.FORMAT, config: reader.config }))
                    .join(', ')}`);
            }
        }

        function initConfig() {
            if (typeof ENV !== 'undefined' && ENV.development && typeof document !== 'undefined') {
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

        /**
         * Validate that barcode position is stable across adjacent Y-scanlines.
         * Real barcodes have consistent start position; tilted barcodes shift left/right as Y changes.
         * @param {Array} line The original scan line [p1, p2]
         * @param {Object} result The successful decode result with .start position
         * @param {Object} reader The reader instance that succeeded
         * @param {Object} inputImageWrapper The full image data
         * @returns {boolean} true if barcode position is stable (≥1 adjacent Y-line matches)
         */
        function validateAdjacentYLines(line, result, reader, inputImageWrapper) {
            // Extract original Y position and X start position
            const originalY = Math.round(line[1].y);
            const originalXStart = result.start;
            const constructorFn = reader.constructor;
            const requiredMatches = (constructorFn && constructorFn.adjacentLineValidationMatches) || 0;

            if (requiredMatches <= 0) {
                return true;
            }

            let matchCount = 0;
            let done = false;

            // Check Y±1, Y±2, Y±3 to see if barcode appears at same X position
            for (const yOffset of [1, 2, 3]) {
                if (done) {
                    break;
                }
                for (const direction of [-1, 1]) {
                    if (done) {
                        break;
                    }
                    const newY = originalY + (yOffset * direction);

                    // Bounds check
                    if (newY < 0 || newY >= inputImageWrapper.size.y) {
                        continue;
                    }

                    // Create new line at adjusted Y, keeping same X range
                    const newP1 = { x: line[0].x, y: newY };
                    const newP2 = { x: line[1].x, y: newY };

                    try {
                        // Extract grayscale at new Y
                        const newBarcodeLine = Bresenham.getBarcodeLine(inputImageWrapper, newP1, newP2);

                        // Binarize
                        Bresenham.toBinaryLine(newBarcodeLine);

                        // Set the row for _findStart() to search in
                        reader._row = newBarcodeLine.line;

                        // Try to find barcode start at this Y
                        const startFound = reader._findStart();

                        if (startFound !== null && startFound.start === originalXStart) {
                            matchCount++;
                            if (matchCount >= requiredMatches) {
                                done = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // Ignore errors, treat failures as "no match" so we can try again on the next line
                    }
                }
            }

            const isValid = matchCount >= requiredMatches;
            return isValid;
        }

        /**
         * Attempts to decode a barcode from a scan line.
         * Readers are tried in order (as specified in config.readers).
         * The first reader to return a non-null result wins.
         * @param {Array} line The scan line to decode
         * @returns {Object|null} Decoded result or null if no reader succeeded
         */
        function tryDecode(line) {
            let result = null;
            let i;
            const barcodeLine = Bresenham.getBarcodeLine(inputImageWrapper, line[0], line[1]);

            if (typeof ENV !== 'undefined' && ENV.development && config.debug.showFrequency) {
                if (_canvas.ctx.overlay) {
                    ImageDebug.drawPath(line, { x: 'x', y: 'y' }, _canvas.ctx.overlay, { color: 'red', lineWidth: 3 });
                }
                Bresenham.debug.printFrequency(barcodeLine.line, _canvas.dom.frequency);
            }

            Bresenham.toBinaryLine(barcodeLine);

            if (typeof ENV !== 'undefined' && ENV.development && config.debug.showPattern) {
                Bresenham.debug.printPattern(barcodeLine.line, _canvas.dom.pattern);
            }

            // Iterate readers in order - first successful decode wins
            let successfulReaderIndex = -1;
            for (i = 0; i < _barcodeReaders.length && result === null; i++) {
                // Provide image context to readers that want it (e.g., pharmacode PGM dumps)
                if (typeof _barcodeReaders[i].setImageWrapper === 'function') {
                    _barcodeReaders[i].setImageWrapper(inputImageWrapper);
                }
                result = _barcodeReaders[i].decodePattern(barcodeLine.line);
                if (result !== null) {
                    successfulReaderIndex = i;
                }
            }
            if (result === null) {
                return null;
            }

            // Validate that barcode position is stable across adjacent Y-scanlines
            // This rejects tilted barcodes that only appear valid at one specific angle
            // Only apply to PharmacodeReader (which explicitly made _findStart public for this validation)
            if (successfulReaderIndex >= 0 && _barcodeReaders[successfulReaderIndex] instanceof PharmacodeReader) {
                if (!validateAdjacentYLines(line, result, _barcodeReaders[successfulReaderIndex], inputImageWrapper)) {
                    return null;
                }
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

        /**
         * Decodes from a full image using readers that support image-based decoding.
         * Readers are tried in order (as specified in config.readers).
         * @param {Object} imageWrapper The image to decode
         * @returns {Object|null} Decoded result or null
         */
        async function decodeFromImage(imageWrapper) {
            let result = null;
            // Iterate readers in order - first successful decode wins
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

            if (typeof ENV !== 'undefined' && ENV.development) {
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

            if (typeof ENV !== 'undefined' && ENV.development && result && config.debug.drawScanline && ctx) {
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
