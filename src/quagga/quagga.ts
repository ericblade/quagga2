import { clone } from 'gl-vec2';
import { QuaggaContext } from '../QuaggaContext';
import _initBuffers from './initBuffers';
import _getViewPort from './getViewPort';
import ImageWrapper from '../common/image_wrapper';
import BarcodeDecoder from '../decoder/barcode_decoder';
import _initCanvas from './initCanvas';
import BarcodeLocator from '../locator/barcode_locator';
import BrowserInputStream, { NodeInputStream } from '../input/input_stream_factory';
import FrameGrabber from '../input/frame_grabber.js';
import * as QWorkers from './qworker';
import setupInputStream from './setupInputStream';
import CameraAccess from '../input/camera_access';
import { BarcodeInfo } from '../reader/barcode_reader';
import { moveLine, moveBox } from './transform';
import { QuaggaJSResultObject, QuaggaJSReaderConfig } from '../../type-definitions/quagga.d';
import Events from '../common/events';

const InputStream = typeof window === 'undefined' ? NodeInputStream : BrowserInputStream;

export default class Quagga {
    context: QuaggaContext = new QuaggaContext();

    initBuffers(imageWrapper?: ImageWrapper): void {
        if (!this.context.config) {
            return;
        }
        const { inputImageWrapper, boxSize } = _initBuffers(
            this.context.inputStream,
            imageWrapper,
            this.context.config.locator,
        );
        this.context.inputImageWrapper = inputImageWrapper;
        this.context.boxSize = boxSize;
    }

    initializeData(imageWrapper?: ImageWrapper): void {
        if (!this.context.config) {
            return;
        }
        this.initBuffers(imageWrapper);
        this.context.decoder = BarcodeDecoder.create(this.context.config.decoder, this.context.inputImageWrapper);
    }

    getViewPort(): Element | null {
        if (!this.context.config || !this.context.config.inputStream) {
            return null;
        }
        const { target } = this.context.config.inputStream;
        return _getViewPort(target);
    }

    ready(callback: () => void): void {
        this.context.inputStream.play();
        callback();
    }

    initCanvas(): void {
        const container = _initCanvas(this.context);
        if (!container) {
            return;
        }
        const { ctx, dom } = container;
        this.context.canvasContainer.dom.image = dom.image;
        this.context.canvasContainer.dom.overlay = dom.overlay;
        this.context.canvasContainer.ctx.image = ctx.image;
        this.context.canvasContainer.ctx.overlay = ctx.overlay;
    }

    canRecord = (callback: () => void): void => {
        if (!this.context.config) {
            return;
        }
        BarcodeLocator.checkImageConstraints(this.context.inputStream, this.context.config?.locator);
        this.initCanvas();
        this.context.framegrabber = FrameGrabber.create(
            this.context.inputStream,
            this.context.canvasContainer.dom.image,
        );

        if (this.context.config.numOfWorkers === undefined) {
            this.context.config.numOfWorkers = 0;
        }

        QWorkers.adjustWorkerPool(this.context.config.numOfWorkers,
            this.context.config,
            this.context.inputStream,
            () => {
                if (this.context.config?.numOfWorkers === 0) {
                    this.initializeData();
                }
                this.ready(callback);
            });
    };

    initInputStream(callback: (err?: Error) => void): void {
        if (!this.context.config || !this.context.config.inputStream) {
            return;
        }
        const { type: inputType, constraints } = this.context.config.inputStream;
        const { video, inputStream } = setupInputStream(inputType, this.getViewPort(), InputStream);

        if (inputType === 'LiveStream' && video) {
            CameraAccess.request(video, constraints)
                .then(() => inputStream.trigger('canrecord'))
                .catch((err) => callback(err));
        }

        inputStream.setAttribute('preload', 'auto');
        inputStream.setInputStream(this.context.config.inputStream);
        inputStream.addEventListener('canrecord', this.canRecord.bind(undefined, callback));

        this.context.inputStream = inputStream;
    }

    getBoundingBoxes(): Array<Array<number>> | null {
        return this.context.config?.locate ? BarcodeLocator.locate()
            : [[
                clone(this.context.boxSize[0]),
                clone(this.context.boxSize[1]),
                clone(this.context.boxSize[2]),
                clone(this.context.boxSize[3]),
            ]];
    }

    // TODO: need a typescript type for result here.
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    transformResult(result: any): void {
        const topRight = this.context.inputStream.getTopRight();
        const xOffset = topRight.x;
        const yOffset = topRight.y;

        if (xOffset === 0 && yOffset === 0) {
            return;
        }

        if (result.barcodes) {
            // TODO: BarcodeInfo may not be the right type here.
            result.barcodes.forEach((barcode: BarcodeInfo) => this.transformResult(barcode));
        }

        if (result.line && result.line.length === 2) {
            moveLine(result.line, xOffset, yOffset);
        }

        if (result.box) {
            moveBox(result.box, xOffset, yOffset);
        }

        if (result.boxes && result.boxes.length > 0) {
            for (let i = 0; i < result.boxes.length; i++) {
                moveBox(result.boxes[i], xOffset, yOffset);
            }
        }
    }

    addResult(result: QuaggaJSResultObject, imageData: Array<number>): void {
        if (!imageData || !this.context.resultCollector) {
            return;
        }

        // TODO: Figure out what data structure holds a "barcodes" result, if any...
        if (result.barcodes) {
            result.barcodes.filter((barcode: QuaggaJSResultObject) => barcode.codeResult)
                .forEach((barcode: QuaggaJSResultObject) => this.addResult(barcode, imageData));
        } else if (result.codeResult) {
            this.context.resultCollector.addResult(
                imageData,
                this.context.inputStream.getCanvasSize(),
                result.codeResult,
            );
        }
    }

    // eslint-disable-next-line class-methods-use-this
    hasCodeResult(result: QuaggaJSResultObject): boolean {
        return !!(result && (result.barcodes
            ? result.barcodes.some((barcode) => barcode.codeResult)
            : result.codeResult));
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    publishResult(result: QuaggaJSResultObject | null = null, imageData?: any): void {
        let resultToPublish: Array<QuaggaJSResultObject> | QuaggaJSResultObject | null = result;

        if (result && this.context.onUIThread) {
            this.transformResult(result);
            this.addResult(result, imageData);
            resultToPublish = result.barcodes || result;
        }

        Events.publish('processed', resultToPublish as never);
        if (this.hasCodeResult(result as QuaggaJSResultObject)) {
            Events.publish('detected', resultToPublish as never);
        }
    }

    locateAndDecode(): void {
        const boxes = this.getBoundingBoxes();
        if (boxes) {
            const decodeResult = this.context.decoder.decodeFromBoundingBoxes(boxes) || {};
            decodeResult.boxes = boxes;
            this.publishResult(decodeResult, this.context.inputImageWrapper?.data);
        } else {
            const imageResult = this.context.decoder.decodeFromImage(this.context.inputImageWrapper);
            if (imageResult) {
                this.publishResult(imageResult, this.context.inputImageWrapper?.data);
            } else {
                this.publishResult();
            }
        }
    }

    update = (): void => {
        if (this.context.onUIThread) {
            const workersUpdated = QWorkers.updateWorkers(this.context.framegrabber);
            if (!workersUpdated) {
                this.context.framegrabber.attachData(this.context.inputImageWrapper?.data);
                if (this.context.framegrabber.grab()) {
                    if (!workersUpdated) {
                        this.locateAndDecode();
                    }
                }
            }
        } else {
            this.context.framegrabber.attachData(this.context.inputImageWrapper?.data);
            this.context.framegrabber.grab();
            this.locateAndDecode();
        }
    };

    startContinuousUpdate(): void {
        let next: number | null = null;
        const delay = 1000 / (this.context.config?.frequency || 60);

        this.context.stopped = false;
        const { context } = this;

        const newFrame = (timestamp: number) => {
            next = next || timestamp;
            if (!context.stopped) {
                if (timestamp >= next) {
                    next += delay;
                    this.update();
                }
                window.requestAnimationFrame(newFrame);
            }
        };

        newFrame(performance.now());
    }

    start(): void {
        if (this.context.onUIThread && this.context.config?.inputStream?.type === 'LiveStream') {
            this.startContinuousUpdate();
        } else {
            this.update();
        }
    }

    stop(): void {
        this.context.stopped = true;
        QWorkers.adjustWorkerPool(0);
        if (this.context.config?.inputStream && this.context.config.inputStream.type === 'LiveStream') {
            CameraAccess.release();
            this.context.inputStream.clearEventHandlers();
        }
    }

    setReaders(readers: Array<QuaggaJSReaderConfig>): void {
        if (this.context.decoder) {
            this.context.decoder.setReaders(readers);
        }
        QWorkers.setReaders(readers);
    }

    registerReader(name: string, reader: QuaggaJSReaderConfig): void {
        BarcodeDecoder.registerReader(name, reader);
        if (this.context.decoder) {
            this.context.decoder.registerReader(name, reader);
        }
        QWorkers.registerReader(name, reader);
    }
}
