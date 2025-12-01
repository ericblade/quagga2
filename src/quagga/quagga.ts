import { vec2 } from 'gl-matrix';
import { QuaggaJSResultObject, QuaggaJSReaderConfig, BarcodeReaderConstructor } from '../../type-definitions/quagga.d';
import Events from '../common/events';
import ImageWrapper from '../common/image_wrapper';
import BarcodeDecoder from '../decoder/barcode_decoder';
import CameraAccess from '../input/camera_access';
import FrameGrabber from '../input/frame_grabber.js';
import InputStream from '../input/input_stream/input_stream';
import BarcodeLocator from '../locator/barcode_locator';
import { QuaggaContext } from '../QuaggaContext';
import { BarcodeInfo } from '../reader/barcode_reader';
import _getViewPort from './getViewPort';
import _initBuffers from './initBuffers';
import _initCanvas from './initCanvas';
import * as QWorkers from './qworker';
import setupInputStream from './setupInputStream';
import { moveLine, moveBox } from './transform';

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

    canRecord = (callback: (err?: Error) => void): void => {
        // Check if init was aborted (e.g., by calling stop() during initialization)
        // This can happen in React StrictMode where components are mounted/unmounted rapidly
        if (this.context.initAborted) {
            callback(new Error('Initialization was aborted'));
            return;
        }
        if (!this.context.config) {
            callback(new Error('Configuration not initialized'));
            return;
        }
        // Check if inputStream is properly initialized before proceeding
        if (!this.context.inputStream) {
            callback(new Error('Input stream not initialized'));
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

        QWorkers.adjustWorkerPool(
            this.context.config.numOfWorkers,
            this.context.config,
            this.context.inputStream,
            () => {
                if (this.context.config?.numOfWorkers === 0) {
                    this.initializeData();
                }
                this.ready(callback);
            },
        );
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

        if (inputStream) {
            inputStream.setAttribute('preload', 'auto');
            inputStream.setInputStream(this.context.config.inputStream);
            inputStream.addEventListener('canrecord', this.canRecord.bind(undefined, callback));
        }

        this.context.inputStream = inputStream;
    }

    getBoundingBoxes(): Array<Array<Array<number>>> | null {
        return this.context.config?.locate ? BarcodeLocator.locate()
            : [[
                vec2.clone(this.context.boxSize[0]),
                vec2.clone(this.context.boxSize[1]),
                vec2.clone(this.context.boxSize[2]),
                vec2.clone(this.context.boxSize[3]),
            ]] as unknown as Array<Array<Array<number>>>;
    }

    // TODO: need a typescript type for result here.
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    transformResult(result: any, transformedBoxes: Set<any> = new Set()): void {
        const topRight = this.context.inputStream.getTopRight();
        const xOffset = topRight.x;
        const yOffset = topRight.y;

        if (xOffset === 0 && yOffset === 0) {
            return;
        }

        if (result.barcodes) {
            // TODO: BarcodeInfo may not be the right type here.
            result.barcodes.forEach((barcode: BarcodeInfo) => this.transformResult(barcode, transformedBoxes));
        }

        if (result.line && result.line.length === 2) {
            moveLine(result.line, xOffset, yOffset);
        }

        if (result.box && !transformedBoxes.has(result.box)) {
            moveBox(result.box, xOffset, yOffset);
            transformedBoxes.add(result.box);
        }

        if (result.boxes && result.boxes.length > 0) {
            for (let i = 0; i < result.boxes.length; i++) {
                // Skip if this box has already been transformed (either as result.box or through barcodes)
                if (!transformedBoxes.has(result.boxes[i])) {
                    moveBox(result.boxes[i], xOffset, yOffset);
                    transformedBoxes.add(result.boxes[i]);
                }
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
            // @ts-ignore
            resultToPublish = result?.barcodes?.length > 0 ? result.barcodes : result;
        }

        Events.publish('processed', resultToPublish as never);
        if (this.hasCodeResult(result as QuaggaJSResultObject)) {
            Events.publish('detected', resultToPublish as never);
        }

        // Redraw scanner area each frame when locate is false via public API.
        const cfg = this.context.config;
        if (cfg && cfg.locate === false && cfg.inputStream?.area) {
            this.drawScannerArea();
        }
    }

    async locateAndDecode(): Promise<void> {
        const boxes = this.getBoundingBoxes();
        if (boxes) {
            const decodeResult = (await this.context.decoder.decodeFromBoundingBoxes(boxes)) || {};
            decodeResult.boxes = boxes;
            this.publishResult(decodeResult, this.context.inputImageWrapper?.data);
        } else {
            const imageResult = await this.context.decoder.decodeFromImage(this.context.inputImageWrapper);
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
        // frequency specifies a maximum rate, not an absolute. If the system cannot
        // achieve the requested frequency, scans will occur as fast as possible.
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

    async stop(): Promise<void> {
        this.context.stopped = true;
        // Set initAborted flag if stop() is called while init() is still in progress
        // (i.e., before framegrabber is initialized). This prevents the canRecord
        // callback from continuing after stop() was called.
        if (!this.context.framegrabber) {
            this.context.initAborted = true;
        }
        QWorkers.adjustWorkerPool(0);
        if (this.context.config?.inputStream && this.context.config.inputStream.type === 'LiveStream') {
            await CameraAccess.release();
            this.context.inputStream?.clearEventHandlers();
        }
    }

    setReaders(readers: Array<QuaggaJSReaderConfig>): void {
        if (this.context.decoder) {
            this.context.decoder.setReaders(readers);
        }
        QWorkers.setReaders(readers);
    }

    registerReader(name: string, reader: BarcodeReaderConstructor): void {
        BarcodeDecoder.registerReader(name, reader);
        if (this.context.decoder) {
            this.context.decoder.registerReader(name, reader);
        }
        QWorkers.registerReader(name, reader);
    }

    /**
     * Public method to draw a scanner area overlay using the current Quagga instance's overlay canvas.
     * Draws based on the instance's configured inputStream.area, using the actual adjusted boxSize
     * to match the real scanning area after patch alignment.
     * Only draws when locate is false and an area is configured with styling.
     */
    private _cachedStyleValues?: { borderColor?: string; borderWidth?: number; backgroundColor?: string };
    private _resolvedStyle?: { color: string; width: number; bg?: string };
    drawScannerArea(): void {
        const area = this.context.config?.inputStream?.area;
        if (!area) return;
        const overlayCtx = this.context.canvasContainer.ctx.overlay;
        if (!overlayCtx) return;

        // Only draw when locate is false
        if (this.context.config?.locate !== false) return;

        // Quick checks for visualization presence
        const hasAnyStyle = (area.borderColor !== undefined && area.borderColor !== '')
            || (area.borderWidth !== undefined && area.borderWidth > 0)
            || (area.backgroundColor !== undefined && area.backgroundColor !== '');
        if (!hasAnyStyle) return;

        // When locate is false, use the actual adjusted boxSize that matches the scanning area
        if (!this.context.boxSize) return;

        // Get the offset for the constrained area
        const topRightOffset = this.context.inputStream.getTopRight();
        const offsetX = topRightOffset.x;
        const offsetY = topRightOffset.y;

        const box = this.context.boxSize;
        const topLeft = box[0];
        const bottomLeft = box[1];
        const topRight = box[3];

        // Add the offset to position correctly on canvas
        const x = topLeft[0] + offsetX;
        const y = topLeft[1] + offsetY;
        const width = topRight[0] - topLeft[0];
        const height = bottomLeft[1] - topLeft[1];
        const styleChanged = !this._cachedStyleValues
            || this._cachedStyleValues.borderColor !== area.borderColor
            || this._cachedStyleValues.borderWidth !== area.borderWidth
            || this._cachedStyleValues.backgroundColor !== area.backgroundColor;
        if (styleChanged) {
            this._cachedStyleValues = {
                borderColor: area.borderColor,
                borderWidth: area.borderWidth,
                backgroundColor: area.backgroundColor,
            };
            const shouldDrawBorder = area.borderColor !== undefined || area.borderWidth !== undefined;
            const color = area.borderColor ?? 'rgba(0, 255, 0, 0.5)';
            const borderWidth = shouldDrawBorder ? (area.borderWidth ?? 2) : 0;
            const bg = area.backgroundColor;
            this._resolvedStyle = { color, width: borderWidth, bg };
        }

        const style = this._resolvedStyle!;
        if (style.bg) {
            overlayCtx.fillStyle = style.bg;
            overlayCtx.fillRect(x, y, width, height);
        }
        if (style.width > 0) {
            overlayCtx.strokeStyle = style.color;
            overlayCtx.lineWidth = style.width;
            overlayCtx.strokeRect(x, y, width, height);
        }
    }
}
