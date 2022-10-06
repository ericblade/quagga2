// NOTE FOR ANYONE IN HERE IN THE FUTURE:
// webpack.config.js replaces the frame_grabber module with THIS module when it is building for a Browser environment.

// TODO: This file has a lot of absolutely bizarre typings that come from the original code reusing the same variables for multiple different things.
// TODO: This needs to be detangled and handled.

import { XYSize } from '../../type-definitions/quagga';
import computeGray from '../common/cvutils/computeGray';
import grayAndHalfSampleFromCanvasData from '../common/cvutils/grayAndHalfSampleFromCanvasData';
import ImageRef from '../common/cvutils/ImageRef';
import { InputStream } from './input_stream/input_stream_base';

const TO_RADIANS = Math.PI / 180;

export interface IFrame {
    data: Uint8Array,
    img?: CanvasImageSource,
    tags?: {
        orientation?: number
    }
}

interface IFrameGrabber {
    attachData: (data: Uint8Array) => void,
    getData: () => Uint8Array,
    getSize: () => ImageRef,
    grab: () => boolean,
    // TODO: frame?!
    scaleAndCrop: (frame: IFrame) => void,
}

interface IFrameGrabberFactory {
    create: (inputStream: InputStream, canvas?: HTMLCanvasElement) => IFrameGrabber
}

function adjustCanvasSize(canvas: HTMLCanvasElement, targetSize: XYSize) {
    if (canvas.width !== targetSize.x) {
        if (ENV.development) {
            console.log('WARNING: canvas-size needs to be adjusted');
        }
        // eslint-disable-next-line no-param-reassign
        canvas.width = targetSize.x;
    }
    if (canvas.height !== targetSize.y) {
        if (ENV.development) {
            console.log('WARNING: canvas-size needs to be adjusted');
        }
        // eslint-disable-next-line no-param-reassign
        canvas.height = targetSize.y;
    }
}

const FrameGrabber: IFrameGrabberFactory = {

    create(inputStream, canvas = document.createElement('canvas')): IFrameGrabber {
        // console.warn('*** FrameGrabberBrowser create');
        const streamConfig = inputStream.getConfig();
        const videoSize = new ImageRef(inputStream.getRealWidth(), inputStream.getRealHeight());
        const canvasSize = inputStream.getCanvasSize();
        const internalSize = new ImageRef(inputStream.getWidth(), inputStream.getHeight());
        const topRight = inputStream.getTopRight();
        const sx = topRight.x;
        const sy = topRight.y;
        const internalCanvas = canvas;
        internalCanvas.width = canvasSize.x;
        internalCanvas.height = canvasSize.y;
        const context = internalCanvas.getContext('2d');
        let data = new Uint8Array(internalSize.x * internalSize.y);

        if (ENV.development) {
            console.log('FrameGrabber', JSON.stringify({
                size: internalSize,
                topRight,
                videoSize,
                canvasSize,
            }));
        }

        /**
         * Uses the given array as frame-buffer
         */
        const that: IFrameGrabber = {
            scaleAndCrop() {
                // TODO: this did not exist in the browser version of this but does in the node version. is it useful here?
            },
            attachData(dataIn) {
                data = dataIn;
            },

            /**
             * Returns the used frame-buffer
             */
            getData() {
                return data;
            },

            /**
             * Fetches a frame from the input-stream and puts into the frame-buffer.
             * The image-data is converted to gray-scale and then half-sampled if configured.
             */
            grab() {
                const doHalfSample = streamConfig.halfSample;
                const frame = inputStream.getFrame();
                let drawable = frame;
                let drawAngle = 0;
                let ctxData;
                if (frame) {
                    adjustCanvasSize(internalCanvas, canvasSize);
                    if (streamConfig.type === 'ImageStream' && (frame as IFrame).img) {
                        drawable = (frame as IFrame).img ?? null;
                        if ((frame as IFrame)?.tags && (frame as IFrame)?.tags?.orientation) {
                            switch ((frame as IFrame)?.tags?.orientation) {
                                case 6:
                                    drawAngle = 90 * TO_RADIANS;
                                    break;
                                case 8:
                                    drawAngle = -90 * TO_RADIANS;
                                    break;
                                default:
                                    break;
                            }
                        }
                    }

                    if (drawAngle !== 0) {
                        context?.translate(canvasSize.x / 2, canvasSize.y / 2);
                        context?.rotate(drawAngle);
                        context?.drawImage(drawable as CanvasImageSource, -canvasSize.y / 2, -canvasSize.x / 2, canvasSize.y, canvasSize.x);
                        context?.rotate(-drawAngle);
                        context?.translate(-canvasSize.x / 2, -canvasSize.y / 2);
                    } else {
                        context?.drawImage(drawable as CanvasImageSource, 0, 0, canvasSize.x, canvasSize.y);
                    }

                    ctxData = context?.getImageData(sx, sy, internalSize.x, internalSize.y).data;
                    if (ctxData) {
                        if (doHalfSample) {
                            grayAndHalfSampleFromCanvasData(ctxData as unknown as Uint8Array, internalSize, data);
                        } else {
                            computeGray(ctxData, data, streamConfig);
                        }
                        return true;
                    }
                }
                return false;
            },

            getSize() {
                return internalSize;
            },
        };

        return that;
    },
};

export default FrameGrabber;
