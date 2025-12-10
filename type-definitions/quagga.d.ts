/* eslint-disable max-classes-per-file */
// Type definitions for QuaggaJS v0.12.1 (2017-10-19)
// Project: http://serratus.github.io/quaggaJS/
// Definitions by: Cam Birch, Peter Horwood aka Madman Pierre, Dan Manastireanu <https://github.com/danmana>

import { vec2 } from 'gl-matrix';

// import SubImage from '../src/common/subImage';
// import ImageWrapper from '../src/common/image_wrapper';
// export { SubImage, ImageWrapper };

declare const Quagga: QuaggaJSStatic;
export default Quagga;

// There are many different spots inside Quagga where we refer to an X/Y position of something, but it has entirely different
// contextual meaning.  This allows us to create a type that is branded by name, and therefore these variables cannot be directly
// mixed up with each other, without explicitly forcing it to happen.  Good.
export interface XYObject<T extends string> {
    type: T;
    x: number;
    y: number;
}

// TODO: fill this in from cv_utils#imageRef
export type ImageRef = XYObject<'ImageRef'>;

export type XYSize = XYObject<'XYSize'>;

export type Point = XYObject<'Point'>;

export type SparseImageWrapper = {
    data: TypedArray | Array<number> | null;
    size: XYSize;
};

export type WrapperIndexMapping = {
    x: Array<number>;
    y: Array<number>;
};

// eslint-disable-next-line @typescript-eslint/class-name-casing
export type Moment = {
    m00: number;
    m01: number;
    m02: number;
    m10: number;
    m11: number;
    m20: number;
    rad: number;
    theta: number;
    vec?: vec2;
};

export class ImageWrapper {
    data: TypedArray | Array<number>;

    size: XYSize;

    indexMapping?: WrapperIndexMapping;

    constructor(
        size: XYSize,
        data?: TypedArray | Array<number>,
        ArrayType?: TypedArrayConstructor | ArrayConstructor,
        initialize?: boolean
    );

    inImageWithBorder(imgRef: ImageRef, border: number): boolean;

    subImageAsCopy(imageWrapper: ImageWrapper, from: XYSize): ImageWrapper;

    get(x: number, y: number): number;

    getSafe(x: number, y: number): number;

    set(x: number, y: number, value: number): ImageWrapper;

    zeroBorder(): ImageWrapper;

    moments(labelCount: any): Array<Moment>;

    getAsRGBA(scale?: number): Uint8ClampedArray;

    show(canvas: HTMLCanvasElement, scale?: number): void;

    overlay(canvas: HTMLCanvasElement, scale: number, from: XYSize): void;
}

export class SubImage {
    I: ImageWrapper | SparseImageWrapper;

    data: ImageWrapper['data'];

    originalSize: ImageRef;

    from: ImageRef;

    size: ImageRef;

    constructor(from: ImageRef, size: ImageRef, I: SparseImageWrapper);

    get(x: number, y: number): number;

    show(canvas: HTMLCanvasElement, scale: number): void;

    updateData(image: ImageWrapper): void;

    updateFrom(from: ImageRef): void;
}

export type QuaggaImageData = Array<number>;

export type BarcodeReaderType = string;

/**
 * Constructor type for a BarcodeReader class.
 * Used when registering custom readers via registerReader().
 */
export type BarcodeReaderConstructor = new (config?: BarcodeReaderConfig, supplements?: Array<Readers.BarcodeReader>) => Readers.BarcodeReader;

export interface BarcodeReaderConfig {
    normalizeBarSpaceWidth?: boolean,
    supplements?: Array<BarcodeReaderType>,
}

export enum BarcodeDirection {
    Forward = 1,
    Reverse = -1,
}
type BarcodeFormat = string;

export interface BarcodeCorrection {
    bar: number;
    space: number;
}

export interface BarcodePosition {
    end: number;
    endCounter?: number;
    error?: number;
    start: number;
    startCounter?: number;
}

export interface BarcodeInfo extends BarcodePosition {
    code: number;
    correction?: BarcodeCorrection;
}

export interface Barcode {
    code: string;
    codeset?: number;
    correction?: BarcodeCorrection;
    decodedCodes?: Array<string | BarcodeInfo | BarcodePosition>;
    direction?: BarcodeDirection;
    end: number;
    endInfo?: BarcodePosition;
    format: BarcodeFormat;
    start: number;
    startInfo: BarcodePosition;
    supplement?: Barcode;
}

export interface ThresholdSize {
    counts: number;
    max: number;
    min: number;
    size: number;
}

export interface Threshold {
    bar: {
        narrow: ThresholdSize;
        wide: ThresholdSize;
    };
    space: {
        narrow: ThresholdSize;
        wide: ThresholdSize;
    };
}

export declare module Readers {
    export abstract class BarcodeReader {
        _row: Array<number>;

        SINGLE_CODE_ERROR: number;

        FORMAT: BarcodeFormat;

        CONFIG_KEYS: BarcodeReaderConfig;

        static get Exception(): {
            CodeNotFoundException: string;
            PatternNotFoundException: string;
            StartNotFoundException: string;
        };

        static adjacentLineValidationMatches: number;

        constructor(config: BarcodeReaderConfig, supplements?: Array<BarcodeReader>);

        abstract decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null;

        decodePattern(pattern: Array<number>): Barcode | null;

        protected _nextUnset(line: ReadonlyArray<number>, start?: number): number;

        protected _matchPattern(counter: ReadonlyArray<number>, code: ReadonlyArray<number>, maxSingleError?: number): number;

        protected _nextSet(line: ReadonlyArray<number>, offset?: number): number;

        protected _correctBars(counter: Array<number>, correction: number, indices: Array<number>): void;

        protected _matchRange(start: number, end: number, value: number): boolean;

        protected _fillCounters(offset?: number, end?: number, isWhite?: boolean): number[];

        protected _toCounters(start: number, counters: Uint16Array | Array<number>): number[] | Uint16Array;
    }

    export class TwoOfFiveReader extends BarcodeReader {
        FORMAT: string;

        SINGLE_CODE_ERROR: number;

        AVG_CODE_ERROR: number;

        decode(row?: Array<number>, start?: BarcodePosition): Barcode | null;

        protected _findPattern(pattern: ReadonlyArray<number>, offset: number, isWhite?: boolean, tryHarder?: boolean): BarcodeInfo | null;

        protected _findStart(): BarcodePosition | null;

        protected _verifyTrailingWhitespace(endInfo: BarcodeInfo): BarcodePosition | null;

        protected _findEnd(): BarcodePosition | null;

        protected _verifyCounterLength(counters: Array<number>): boolean;

        protected _decodeCode(counter: ReadonlyArray<number>): BarcodeInfo | null;

        protected _decodePayload(counters: ReadonlyArray<number>, result: Array<string>, decodedCodes: Array<BarcodeInfo | BarcodePosition>): BarcodeInfo | null;
    }

    export class NewCodabarReader extends BarcodeReader {
        FORMAT: string;

        decode(row?: Array<number>, start?: BarcodePosition | number | null): Barcode | null;

        protected _computeAlternatingThreshold(offset: number, end: number): number;

        protected _toPattern(offset: number): number;

        protected _isStartEnd(pattern: number): boolean;

        protected _sumCounters(start: number, end: number): number;

        protected _findStart(): BarcodePosition | null;

        protected _patternToChar(pattern: number): string | null;

        protected _calculatePatternLength(offset: number): number;

        protected _verifyWhitespace(startCounter: number, endCounter: number): boolean;

        protected _charToPattern(char: string): number;

        protected _thresholdResultPattern(result: ReadonlyArray<string>, startCounter: number): Threshold;

        protected _validateResult(result: ReadonlyArray<string>, startCounter: number): boolean;
    }

    export class Code128Reader extends BarcodeReader {
        CODE_SHIFT: number;

        CODE_C: number;

        CODE_B: number;

        CODE_A: number;

        START_CODE_A: number;

        START_CODE_B: number;

        START_CODE_C: number;

        STOP_CODE: number;

        CODE_PATTERN: number[][];

        SINGLE_CODE_ERROR: number;

        AVG_CODE_ERROR: number;

        FORMAT: string;

        MODULE_INDICES: {
            bar: number[];
            space: number[];
        };

        decode(row?: Array<number>, start?: BarcodePosition): Barcode | null;

        calculateCorrection(expected: ReadonlyArray<number>, normalized: ReadonlyArray<number>, indices: ReadonlyArray<number>): number;

        protected _decodeCode(start: number, correction?: BarcodeCorrection): BarcodeInfo | null;

        protected _correct(counter: Array<number>, correction: BarcodeCorrection): void;

        protected _findStart(): BarcodeInfo | null;

        protected _verifyTrailingWhitespace(endInfo: BarcodeInfo): BarcodeInfo | null;
    }

    export class Code39Reader extends BarcodeReader {
        FORMAT: string;

        decode(row?: Array<number>, start?: BarcodePosition | number | null): Barcode | null;

        protected _findStart(): BarcodePosition | null;

        protected _toPattern(counters: Uint16Array): number;

        protected _findNextWidth(counters: Uint16Array, current: number): number;

        protected _patternToChar(pattern: number): string | null;

        protected _verifyTrailingWhitespace(lastStart: number, nextStart: number, counters: Uint16Array): boolean;
    }

    export class Code32Reader extends Code39Reader {
        FORMAT: string;

        decode(row?: Array<number>, start?: BarcodePosition): Barcode | null;

        protected _decodeCode32(code: string): string | null;

        protected _checkChecksum(code: string): boolean;
    }

    export class Code39VINReader extends Code39Reader {
        FORMAT: string;

        decode(row?: Array<number>, start?: BarcodePosition): Barcode | null;

        protected _checkChecksum(code: string): boolean;
    }

    export class Code93Reader extends BarcodeReader {
        FORMAT: string;

        decode(row?: Array<number>, start?: BarcodePosition | number | null): Barcode | null;

        protected _patternToChar(pattern: number): string | null;

        protected _toPattern(counters: Uint16Array): number;

        protected _findStart(): BarcodePosition | null;

        protected _verifyEnd(lastStart: number, nextStart: number): boolean;

        protected _decodeExtended(charArray: Array<string>): string[] | null;

        protected _matchCheckChar(charArray: Array<string>, index: number, maxWeight: number): boolean;

        protected _verifyChecksums(charArray: Array<string>): boolean;
    }

    export class EANReader extends BarcodeReader {
        FORMAT: string;
        SINGLE_CODE_ERROR: number;
        STOP_PATTERN: number[];

        constructor(config?: BarcodeReaderConfig, supplements?: Array<BarcodeReader>);

        decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null;

        protected _findPattern(pattern: ReadonlyArray<number>, offset: number, isWhite: boolean, tryHarder: boolean): BarcodePosition | null;

        protected _decodeCode(start: number, coderange?: number): BarcodeInfo | null;

        protected _findStart(): BarcodePosition | null;

        protected _decodePayload(inCode: BarcodePosition, result: Array<number>, decodedCodes: Array<BarcodePosition>): BarcodeInfo | null;

        protected _verifyTrailingWhitespace(endInfo: BarcodePosition): BarcodePosition | null;

        protected _findEnd(offset: number, isWhite: boolean): BarcodePosition | null;

        protected _checksum(result: Array<number>): boolean;
    }

    export class EAN2Reader extends EANReader {
        FORMAT: string;

        decode(row?: Array<number>, start?: number): Barcode | null;
    }

    export class EAN5Reader extends EANReader {
        FORMAT: string;

        decode(row?: Array<number>, start?: number): Barcode | null;
    }

    export class EAN8Reader extends EANReader {
        FORMAT: string;

        protected _decodePayload(inCode: BarcodePosition, result: Array<number>, decodedCodes: Array<BarcodePosition>): BarcodeInfo | null;
    }

    export class I2of5Reader extends BarcodeReader {
        SINGLE_CODE_ERROR: number;

        AVG_CODE_ERROR: number;

        START_PATTERN: number[];

        STOP_PATTERN: number[];

        CODE_PATTERN: number[][];

        MAX_CORRECTION_FACTOR: number;

        FORMAT: string;

        constructor(opts: BarcodeReaderConfig);

        decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null;

        protected _matchPattern(counter: Array<number>, code: ReadonlyArray<number>): number;

        protected _findPattern(pattern: ReadonlyArray<number>, offset?: number, isWhite?: boolean, tryHarder?: boolean): BarcodePosition | null;

        protected _findStart(): BarcodePosition | null;

        protected _verifyTrailingWhitespace(endInfo: BarcodePosition): BarcodePosition | null;

        protected _findEnd(): BarcodePosition | null;

        protected _decodePair(counterPair: Array<Array<number>>): Array<BarcodeInfo> | null;

        protected _decodeCode(counter: Array<number>): BarcodeInfo | null;

        protected _decodePayload(counters: ReadonlyArray<number>, result: Array<string>, decodedCodes: Array<BarcodeInfo | BarcodePosition>): Array<BarcodeInfo> | null;

        protected _verifyCounterLength(counters: Array<number>): boolean;
    }

    export class UPCEReader extends EANReader {
        CODE_FREQUENCY: number[][];

        STOP_PATTERN: number[];

        FORMAT: string;

        protected _decodePayload(inCode: BarcodePosition, result: Array<number>, decodedCodes: Array<BarcodePosition>): BarcodeInfo | null;

        protected _determineParity(codeFrequency: number, result: Array<number>): boolean;

        protected _convertToUPCA(result: Array<number>): number[];

        protected _checksum(result: Array<number>): boolean;

        protected _findEnd(offset: number, isWhite: boolean): BarcodePosition | null;

        protected _verifyTrailingWhitespace(endInfo: BarcodePosition): BarcodePosition | null;
    }

    export class UPCReader extends EANReader {
        FORMAT: string;

        decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null;
    }

}

export interface QuaggaJSStatic {
    /**
     * This method initializes the library for a given
     * configuration config (see below) and invokes the callback when Quagga is
     * ready to start. The initialization process also requests for camera
     * access if real-time detection is configured.
     */
    init(
        config: QuaggaJSConfigObject,
        callback?: (err: any) => void
    ): Promise<void>;

    init(
        config: QuaggaJSConfigObject,
        callback: (err: any) => void,
        imageWrapper: ImageWrapper,
    ): Promise<void>;

    /**
     * When the library is initialized, the start()
     * method starts the video-stream and begins locating and decoding the
     * images.
     *
     * Optionally, you can pass a config object to start(), which will
     * call init() and then start() for convenience.
     *
     * If start() is called without init() having been completed first,
     * and no config is provided, an error will be thrown.
     */
    start(): void;

    /**
     * Combines init() and start() into a single call. Pass a config object
     * and optionally a callback. If no callback is provided, returns a Promise.
     */
    start(config: QuaggaJSConfigObject, callback?: (err: any) => void): Promise<void>;

    /**
     * If the decoder is currently running, after calling
     * stop() the decoder does not process any more images.
     * Additionally, if a camera-stream was requested upon initialization,
     * this operation also disconnects the camera.
     */
    stop(): Promise<void>;

    /**
     * Pauses processing, but does not release any handlers
     */
    pause(): void;

    /**
     * This method registers a callback(data) function that is
     * called for each frame after the processing is done. The data object
     * contains detailed information about the success/failure of the operation.
     * The output varies, depending whether the detection and/or decoding were
     * successful or not.
     */
    onProcessed(callback: QuaggaJSResultCallbackFunction): void;

    /**
     * Removes a callback that was previously registered with @see onProcessed
     */
    offProcessed(callback?: QuaggaJSResultCallbackFunction): void;

    /**
     * Registers a callback(data) function which is triggered whenever a
     * barcode- pattern has been located and decoded successfully. The passed
     * data object contains information about the decoding process including the
     * detected code which can be obtained by calling data.codeResult.code.
     */
    onDetected(callback: QuaggaJSResultCallbackFunction): void;

    /**
     * Removes a callback that was previously registered with @see onDetected
     */
    offDetected(callback?: QuaggaJSResultCallbackFunction): void;

    ResultCollector: QuaggaJSResultCollector;
    registerResultCollector(resultCollector: QuaggaJSResultCollector): void;
    setReaders(readers: (QuaggaJSReaderConfig | string)[]): void;
    registerReader(name: string, reader: BarcodeReaderConstructor): void;

    /**
     * In contrast to the calls described
     * above, this method does not rely on getUserMedia and operates on a single
     * image instead. The provided callback is the same as in onDetected and
     * contains the result data object.
     */
    decodeSingle(
        config: QuaggaJSConfigObject,
        resultCallback?: QuaggaJSResultCallbackFunction
    ): Promise<QuaggaJSResultObject>;

    /**
     * Constructs used for debugging purposes
     */
    ImageDebug: {
        drawPath: QuaggaJSDebugDrawPath;
        drawRect: QuaggaJSDebugDrawRect;
    };
    ImageWrapper: ImageWrapper;

    /**
     * an object Quagga uses for drawing and processing, useful for calling code
     * when debugging
     */
    canvas: {
        ctx: {
            image: CanvasRenderingContext2D;
            overlay: CanvasRenderingContext2D | null;
        };
        dom: {
            image: HTMLCanvasElement;
            overlay: HTMLCanvasElement | null;
        };
    };

    CameraAccess: QuaggaJSCameraAccess;

    /**
     * Draws a scanner area overlay onto the overlay canvas using the current instance's configured area.
     * Uses the actual adjusted scanning area (after patch alignment) to accurately show where barcodes will be detected.
     * Useful when user code clears the overlay each frame and wants to re-render the area.
     * Only draws when locate is false and inputStream.area is configured with styling.
     */
    drawScannerArea(): void;
}

/**
 * Used for accessing information about the active stream track and available video devices.
 */
export interface QuaggaJSCameraAccess {
    disableTorch(): Promise<void>;
    enableTorch(): Promise<void>;
    /**
     * Enumerates video input devices, optionally filtering by constraints.
     * @param videoConstraints Optional constraints to filter devices.
     * When provided, only devices that satisfy the given constraints will be returned.
     * This works by attempting to get a media stream for each device with the constraints
     * and returning only the devices that succeed.
     * @returns Promise resolving to an array of MediaDeviceInfo for video input devices.
     */
    enumerateVideoDevices(
        videoConstraints?: MediaTrackConstraintsWithDeprecated
    ): Promise<MediaDeviceInfo[]> | never;
    /**
     * Returns the active MediaStream, or null if no stream is active.
     * Use this when you need access to the full stream, for example to pass to WebRTC
     * or to clone the stream. For just the video track, use getActiveTrack() instead.
     */
    getActiveStream(): MediaStream | null;
    getActiveStreamLabel(): string;
    getActiveTrack(): MediaStreamTrack | null;
    release(): Promise<void>;
    request(
        video: HTMLVideoElement | null,
        videoConstraints?: MediaTrackConstraintsWithDeprecated
    ): Promise<void> | never;
    requestedVideoElement: HTMLVideoElement | null;
}

/**
 * Called whenever an item is detected or a process step has been completed.
 */
export interface QuaggaJSResultCallbackFunction {
    (
        data: QuaggaJSResultObject
    ): void;
}

/**
 * Called to draw debugging path. The path is an array of array of 2 numbers.
 * The def.x specifies element in the sub array is the x, and similarly the def.y
 * defines the y.
 * typical values 0, 1, 'x', 'y'
 */
export interface QuaggaJSDebugDrawPath {
    (
        path: any[],
        def: QuaggaJSxyDef,
        ctx: CanvasRenderingContext2D,
        style: QuaggaJSStyle
    ): void;
}

/**
 * Called to draw debugging Rectangle
 */
export interface QuaggaJSDebugDrawRect {
    (
        pos: any[],
        size: QuaggaJSRectSize,
        ctx: CanvasRenderingContext2D,
        style: QuaggaJSStyle
    ): void;
}

/**
 * an object with an x and a y value, the x and y specify which element in
 * another array is the x or y value.
 * typical values 0, 1, 'x', 'y'
 */
// TODO: remove QuaggaJSxyDef from global type-defs (it's only used in image_debug, i think, which has a local definition)
export interface QuaggaJSxyDef {
    x: any;
    y: any;
}

/**
 * an object with an x and a y value
 */
export interface QuaggaJSxy {
    x: number;
    y: number;
}

/**
 * an object with a pair of x and a y values.
 * Used for giving a html canvas context.strokeRect function it's x, y, width
 * and height values.
 */
export interface QuaggaJSRectSize {
    pos: QuaggaJSxy;
    size: QuaggaJSxy;
}

/**
 * an object with the styles, color can actually be a color, a gradient or a
 * pattern (see definitions for context.strokeStyle. But is most commonly a
 * colour.
 */
export interface QuaggaJSStyle {
    color: string;

    /* http://www.w3schools.com/tags/canvas_linewidth.asp */
    lineWidth: number;
}

/**
 * Pass when creating a ResultCollector
 */
export interface QuaggaJSResultCollector {
    /**
     * keep track of the image producing this result
     */
    capture?: boolean;

    /**
     * maximum number of results to store
     */
    capacity?: number;

    /**
     * a list of codes that should not be recorded. This is effectively a list
     * of filters that return false.
     */
    blacklist?: Array<QuaggaJSCodeResult>;

    /**
     * passed a QuaggaJSCodeResult, return true if you want this to be stored,
     * false if you don't. Note: The black list is effectively a list of filters
     * that return false. So if you only want to store results that are ean_13,
     * you would say return codeResult.format==="ean_13"
     */
    filter?: QuaggaJSResultCollectorFilterFunction;

    /*
     * a static function that returns you a ResultCollector
     */
    create?(param: QuaggaJSResultCollector): QuaggaJSResultCollector;

    getResults?(): QuaggaJSCodeResult[];
    willReadFrequently?: boolean;
}

/**
 * used for ResultCollector blacklists and filters
 */
export interface QuaggaJSCodeResult {
    code?: string;
    format?: string;
}

/**
 * Called to filter which Results to collect in ResultCollector
 */
export interface QuaggaJSResultCollectorFilterFunction {
    (
        data: QuaggaJSCodeResult
    ): boolean;
}

/**
 * The callbacks passed into onProcessed, onDetected and decodeSingle receive a
 * data object upon execution. The data object contains the following
 * information. Depending on the success, some fields may be undefined or just
 * empty.
 */
export interface QuaggaJSResultObject {
    // eslint-disable-next-line @typescript-eslint/camelcase
    codeResult: QuaggaJSResultObject_CodeResult;
    barcodes?: Array<QuaggaJSResultObject>;
    line: {
        x: number;
        y: number;
    }[];
    angle: number;
    pattern: number[];
    box: number[][];
    boxes: number[][][];
    frame?: string;
}

// eslint-disable-next-line @typescript-eslint/camelcase,@typescript-eslint/class-name-casing
export interface QuaggaJSResultObject_CodeResult {
    code: string | null;
    start: number;
    end: number;
    codeset: number;
    startInfo: {
        error: number;
        code: number;
        start: number;
        end: number;
    };
    decodedCodes: {
        error?: number;
        code: number;
        start: number;
        end: number;
    }[];

    endInfo: {
        error: number;
        code: number;
        start: number;
        end: number;
    };
    direction: number;
    format: string;
}

export type InputStreamType = 'VideoStream' | 'ImageStream' | 'LiveStream';

export interface QuaggaJSConfigObject {
    /**
     * The image path to load from, or a data url
     * Ex: '/test/fixtures/code_128/image-001.jpg'
     * or: 'data:image/jpg;base64,' + data
     */
    src?: string | Uint8Array;

    inputStream?: {
        /**
         * @default "LiveStream"
         */
        type?: InputStreamType;

        /**
         * Use canvas.getContext('2d', { willReadFrequently: true }) for browser frame grabber operations
         * @default false
         * ... defaulting false because historically this wasn't an option, so i don't want to change behavior
         */
        willReadFrequently?: boolean;

        target?: Element | string;

        constraints?: MediaTrackConstraints;

        /**
         * defines rectangle of the detection/localization area. Useful when you
         * KNOW that certain parts of the image will not contain a barcode, also
         * useful when you have multiple barcodes in a row and you want to make
         * sure that only a code in, say the middle quarter is read not codes
         * above or below
         */
        area?: {
            /**
             * @default "0%", set this and bottom to 25% if you only want to
             * read a 'line' that is in the middle quarter
             */
            top?: string;

            /**
             * @default "0%"
             */
            right?: string;

            /**
             * @default "0%"
             */
            left?: string;

            /**
             * @default "0%", set this and top to 50% if you only want to read a
             * 'line' that is in the middle half
             */
            bottom?: string;

            /**
             * Color of the area border. When defined, draws a rectangle on the overlay canvas
             * showing the scan area boundaries. Requires createOverlay to be true.
             * Can be any valid CSS color value.
             * @default undefined (no border drawn)
             */
            borderColor?: string;

            /**
             * Line width of the area border in pixels.
             * When defined with a value > 0, draws a rectangle on the overlay canvas.
             * @default undefined (no border drawn)
             */
            borderWidth?: number;

            /**
             * Background color to fill the scan area.
             * Can be any valid CSS color value (e.g., 'rgba(0, 255, 0, 0.1)' for a light green tint).
             * @default undefined (no background fill)
             */
            backgroundColor?: string;
        };

        mime?: string;

        singleChannel?: boolean;
        size?: number;
        sequence?: boolean;

        debug?: {
            /**
             * @default false
             * Logs frame grabber info, canvas size adjustments, and image loading details
             */
            showImageDetails?: boolean;
        };
    };

    /**
     * @default false
     */
    debug?: boolean;

    /**
     * @default true
     */
    locate?: boolean;

    /**
     * @default 4
     */
    numOfWorkers?: number;

    /**
     * This top-level property controls the scan-frequency of the video-stream.
     * It’s optional and defines the maximum number of scans per second.
     * This renders useful for cases where the scan-session is long-running and
     * resources such as CPU power are of concern.
     *
     * Note: This specifies a maximum, not an absolute rate. If the system cannot
     * achieve the requested frequency due to CPU limitations or other factors,
     * scans will occur as fast as the system allows.
     */
    frequency?: number;

    /**
     * Canvas configuration options for controlling overlay and debug canvases.
     */
    canvas?: {
        /**
         * Whether to create the overlay canvas (drawingBuffer) for drawing bounding boxes
         * and scan lines. Set to false if you don't need visual feedback and want to
         * improve performance.
         * @default true
         */
        createOverlay?: boolean;
    };

    decoder?: {
        /**
         * @default [ "code_128_reader" ]
         */
        readers?: (QuaggaJSReaderConfig | QuaggaJSCodeReader)[];

        debug?: {
            /**
             * @default false
             */
            drawBoundingBox?: boolean;

            /**
             * @default false
             */
            showFrequency?: boolean;

            /**
             * @default false
             */
            drawScanline?: boolean;

            /**
             * @default false
             */
            showPattern?: boolean;

            /**
             * @default false
             * Logs reader registration and initialization to console
             */
            printReaderInfo?: boolean;
        };

        /**
         * The multiple property tells the decoder if it should continue decoding after finding a valid barcode.
         * If multiple is set to true, the results will be returned as an array of result objects.
         * Each object in the array will have a box, and may have a codeResult
         * depending on the success of decoding the individual box.
         */
        multiple?: boolean;
    };

    locator?: {
        /**
         * @default true
         */
        halfSample?: boolean;

        /**
         * @default "medium"
         * Available values: x-small, small, medium, large, x-large
         */
        patchSize?: string;

        willReadFrequently?: boolean;
        debug?: {
            /**
             * @default false
             */
            showCanvas?: boolean;

            /**
             * @default false
             */
            showPatches?: boolean;

            /**
             * @default false
             */
            showFoundPatches?: boolean;

            /**
             * @default false
             */
            showSkeleton?: boolean;

            /**
             * @default false
             */
            showLabels?: boolean;

            /**
             * @default false
             */
            showPatchLabels?: boolean;

            /**
             * @default false
             */
            showRemainingPatchLabels?: boolean;

            /**
             * @default false
             * Logs calculated patch size to console
             */
            showPatchSize?: boolean;

            /**
             * @default false
             * Logs image wrapper size and canvas details to console
             */
            showImageDetails?: boolean;

            boxFromPatches?: {
                /**
                 * @default false
                 */
                showTransformed?: boolean;

                /**
                 * @default false
                 */
                showTransformedBox?: boolean;

                /**
                 * @default false
                 */
                showBB?: boolean;
            };
        };
    };
}

export interface QuaggaJSReaderConfig {
    config: {
        supplements: string[];
    };
    format: string;
}

export interface MediaTrackConstraintsWithDeprecated extends MediaTrackConstraints {
    facing?: string;
    maxAspectRatio?: number; // i don't see this in the documentation anywhere, but it's in the original test suite...
    minAspectRatio?: number;
}

export type TypedArrayConstructor =
    Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor;

export type TypedArray =
    Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;

export type QuaggaJSCodeReader =
    | 'code_128_reader'
    | 'ean_reader'
    | 'ean_5_reader'
    | 'ean_2_reader'
    | 'ean_8_reader'
    | 'code_39_reader'
    | 'code_39_vin_reader'
    | 'codabar_reader'
    | 'upc_reader'
    | 'upc_e_reader'
    | 'i2of5_reader'
    | '2of5_reader'
    | 'code_93_reader'
    | 'code_32_reader'
    | 'pharmacode_reader';
