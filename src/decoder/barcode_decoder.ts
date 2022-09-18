import { Point, QuaggaJSConfigObject, QuaggaJSReaderConfig, XYSize } from '../../type-definitions/quagga';
// import ImageDebug, { DebugPath } from '../common/image_debug';
import ImageWrapper from '../common/image_wrapper';
import TwoOfFiveReader from '../reader/2of5_reader';
import BarcodeReader, { Barcode, BarcodeReaderConfig } from '../reader/barcode_reader';
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
import { getBarcodeLineDDA as getBarcodeLine, toBinaryLine } from './bresenham';

export type BarcodeReaderClass = new (config: BarcodeReaderConfig, supplements?: Array<BarcodeReader>) => BarcodeReader;

const READERS: Record<string, BarcodeReaderClass> = {
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

interface InternalCanvas {
    frequency: CanvasRenderingContext2D | HTMLCanvasElement | null,
    overlay: CanvasRenderingContext2D | HTMLCanvasElement | null,
    pattern: CanvasRenderingContext2D | HTMLCanvasElement | null,
}

interface InternalCanvasCache {
    ctx: InternalCanvas,
    dom: InternalCanvas,
}

export default {
    registerReader: (name: string, reader: BarcodeReaderClass) => {
        READERS[name] = reader;
    },
    create(config: QuaggaJSConfigObject['decoder'], inputImageWrapper: ImageWrapper) {
        const internalCanvas: InternalCanvasCache = {
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
        const barcodeReaders: Array<BarcodeReader> = [];

        function initCanvas() {
            // TODO: holy wow, this function's variable reuse, as well as the types for InternalCanvasCache are a big mess
            if (ENV.development && typeof document !== 'undefined') {
                const $debug = document.querySelector('#debug.detection');
                internalCanvas.dom.frequency = document.querySelector<HTMLCanvasElement>('canvas.frequency');
                if (!internalCanvas.dom.frequency) {
                    internalCanvas.dom.frequency = document.createElement('canvas');
                    internalCanvas.dom.frequency.className = 'frequency';
                    if ($debug) {
                        $debug.appendChild(internalCanvas.dom.frequency);
                    }
                }
                internalCanvas.ctx.frequency = internalCanvas.dom.frequency.getContext('2d');

                internalCanvas.dom.pattern = document.querySelector<HTMLCanvasElement>('canvas.patternBuffer');
                if (!internalCanvas.dom.pattern) {
                    internalCanvas.dom.pattern = document.createElement('canvas');
                    internalCanvas.dom.pattern.className = 'patternBuffer';
                    if ($debug) {
                        $debug.appendChild(internalCanvas.dom.pattern);
                    }
                }
                internalCanvas.ctx.pattern = internalCanvas.dom.pattern.getContext('2d');

                internalCanvas.dom.overlay = document.querySelector<HTMLCanvasElement>('canvas.drawingBuffer');
                if (internalCanvas.dom.overlay) {
                    internalCanvas.ctx.overlay = internalCanvas.dom.overlay.getContext('2d');
                }
            }
        }

        function initReaders() {
            if (!config) {
                throw new Error('quagga configuration error: no configuration!');
            }
            if (!config.readers) {
                throw new Error('quagga configuration error: no readers defined!');
            }
            config.readers.forEach((readerConfig) => {
                let reader;
                let configuration: QuaggaJSReaderConfig['config'] | Record<string, never> = {};
                let supplements: Array<BarcodeReader> = [];

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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    supplements = configuration
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        .supplements.map((supplement) => new READERS[supplement](configuration));
                }
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                    const readerObj = (new READERS[reader as string](configuration, supplements));
                    barcodeReaders.push(readerObj);
                } catch (err) {
                    console.error('* Error constructing reader ', reader, err);
                    throw err;
                }
            });
            if (ENV.development) {
                console.log(`Registered Readers: ${barcodeReaders
                    .map((reader) => JSON.stringify({ format: reader.FORMAT, config: reader.config }))
                    .join(', ')}`);
            }
        }

        function initConfig() {
            if (ENV.development && typeof document !== 'undefined') {
                let i;
                const vis = [{
                    node: internalCanvas.dom.frequency,
                    prop: config?.debug?.showFrequency,
                }, {
                    node: internalCanvas.dom.pattern,
                    prop: config?.debug?.showPattern,
                }];

                for (i = 0; i < vis.length; i++) {
                    if (vis[i].prop === true) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        (vis[i].node as HTMLCanvasElement).style.display = 'block';
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        (vis[i].node as HTMLCanvasElement).style.display = 'none';
                    }
                }
            }
        }

        /**
         * extend the line on both ends
         * @param {Array} line
         * @param {Number} angle
         */
        function getExtendedLine(line: Array<XYSize>, angle: number, ext: number) {
            function extendLine(amount: number) {
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
            while (ext > 1 && (!inputImageWrapper.inImageWithBorder(line[0], 1)
                    || !inputImageWrapper.inImageWithBorder(line[1], 1))) {
                // eslint-disable-next-line no-param-reassign
                ext -= Math.ceil(ext / 2);
                extendLine(-ext);
            }
            return line;
        }

        function getLine(box: Array<Array<number>>) {
            return [{
                x: (box[1][0] - box[0][0]) / 2 + box[0][0],
                y: (box[1][1] - box[0][1]) / 2 + box[0][1],
            }, {
                x: (box[3][0] - box[2][0]) / 2 + box[2][0],
                y: (box[3][1] - box[2][1]) / 2 + box[2][1],
            }];
        }

        function tryDecode(line: Array<Point>) {
            const barcodeLine = getBarcodeLine(inputImageWrapper, line[0], line[1]);

            if (ENV.development && config?.debug?.showFrequency) {
                // TODO: rewrite ImageDebug to deal with typings properly
                // ImageDebug.drawPath(line, { x: 'x', y: 'y' }, internalCanvas.ctx.overlay, { color: 'red', lineWidth: 3 });
                // TODO: dig out Bresenham debug and convert it properly and reenable in this file
                // Bresenham.debug.printFrequency(barcodeLine.line, _canvas.dom.frequency);
            }

            const binaryLine = toBinaryLine(barcodeLine);

            if (ENV.development && config?.debug?.showPattern) {
                // Bresenham.debug.printPattern(barcodeLine.line, _canvas.dom.pattern);
            }

            let result: Barcode | null = null;
            if (barcodeReaders.some((reader) => {
                result = reader.decodePattern(binaryLine.line);
                return result !== null;
            })) {
                return {
                    codeResult: result,
                    barcodeLine: binaryLine,
                };
            }
            return null;
        }

        /**
         * This method slices the given area apart and tries to detect a barcode-pattern
         * for each slice. It returns the decoded barcode, or null if nothing was found
         * @param {Array} box
         * @param {Array} line
         * @param {Number} lineAngle
         */
        function tryDecodeBruteForce(box: Array<Array<number>>, line: Array<Point>, lineAngle: number) {
            const sideLength = Math.sqrt(((box[1][0] - box[0][0]) ** 2) + ((box[1][1] - box[0][1]) ** 2));
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

        function getLineLength(line: Array<Point>) {
            return Math.sqrt(
                Math.abs(line[1].y - line[0].y) ** 2
                + Math.abs(line[1].x - line[0].x) ** 2,
            );
        }

        async function decodeFromImage(imageWrapper: ImageWrapper) {
            let result = null;
            // eslint-disable-next-line no-restricted-syntax
            for (const reader of barcodeReaders) {
                if (reader.decodeImage) {
                    // eslint-disable-next-line no-await-in-loop
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
        function decodeFromBoundingBox(box: Array<Array<number>>) {
            let line;
            const ctx = internalCanvas.ctx.overlay;
            let result;

            if (ENV.development) {
                if (config?.debug?.drawBoundingBox && ctx) {
                    // ImageDebug.drawPath(box, { x: 0, y: 1 }, ctx as CanvasRenderingContext2D, { color: 'blue', lineWidth: 2 });
                }
            }

            line = getLine(box);
            const lineLength = getLineLength(line);
            const lineAngle = Math.atan2(line[1].y - line[0].y, line[1].x - line[0].x);
            line = getExtendedLine(line, lineAngle, Math.floor(lineLength * 0.1));
            if (line === null) {
                return null;
            }

            result = tryDecode(line as unknown as Array<Point>); // TODO fix this
            if (result === null) {
                result = tryDecodeBruteForce(box, line as unknown as Array<Point>, lineAngle);
            }

            if (result === null) {
                return null;
            }

            if (ENV.development && result && config?.debug?.drawScanline && ctx) {
                // ImageDebug.drawPath(line, { x: 'x', y: 'y' }, ctx, { color: 'red', lineWidth: 3 });
            }

            return {
                codeResult: result.codeResult,
                line,
                angle: lineAngle,
                pattern: result.barcodeLine.line,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                threshold: result.barcodeLine.threshold,
            };
        }

        initCanvas();
        initReaders();
        initConfig();

        return {
            decodeFromBoundingBox(box: Array<Array<number>>) {
                return decodeFromBoundingBox(box);
            },
            decodeFromBoundingBoxes(boxes: Array<Array<Array<number>>>) {
                let i; let result;
                const barcodes = [];
                const multiple = config?.multiple;

                for (i = 0; i < boxes.length; i++) {
                    const box = boxes[i];
                    result = decodeFromBoundingBox(box) || {};
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (result as any).box = box; // TODO

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
            async decodeFromImage(imageWrapperIn: ImageWrapper) {
                const result = await decodeFromImage(imageWrapperIn);
                return result;
            },
            registerReader(name: string, reader: BarcodeReaderClass) {
                if (READERS[name]) {
                    throw new Error(`cannot register existing reader ${name}`);
                }
                READERS[name] = reader;
            },
            setReaders(readers: Array<QuaggaJSReaderConfig>) {
                if (!config) {
                    throw new Error('setReaders called before initialization');
                }
                // eslint-disable-next-line no-param-reassign
                config.readers = readers;
                barcodeReaders.length = 0;
                initReaders();
            },
        };
    },
};
