// NOTE FOR ANYONE IN HERE IN THE FUTURE: This module is used when the module is built for use in Node.
// Webpack.config.js explicitly REPLACES this module with the file called frame_grabber_browser when it is packing the Browser distribution.

// ALSO NOTE: @types/ndarray works like garbage in vscode. I have no idea why.

import Ndarray from 'ndarray';
import { d2 as Interp2D } from 'ndarray-linear-interpolate';
import computeGray from '../common/cvutils/computeGray';
import ImageRef from '../common/cvutils/ImageRef';
import { InputStream } from './input_stream/input_stream_base';

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

const Factory: IFrameGrabberFactory = {
    create(inputStream) {
        const videoSize = new ImageRef(inputStream.getRealWidth(), inputStream.getRealHeight());
        const canvasSize = inputStream.getCanvasSize();
        const size = new ImageRef(inputStream.getWidth(), inputStream.getHeight());
        const topRight = inputStream.getTopRight();
        let internalData = new Uint8Array(size.x * size.y);
        const grayData = new Uint8Array(videoSize.x * videoSize.y);
        const canvasData = new Uint8Array(canvasSize.x * canvasSize.y);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const grayImageArray = Ndarray(grayData, [videoSize.y, videoSize.x]).transpose(1, 0);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const canvasImageArray = Ndarray(canvasData, [canvasSize.y, canvasSize.x]).transpose(1, 0);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const targetImageArray = canvasImageArray
            .hi(topRight.x + size.x, topRight.y + size.y)
            .lo(topRight.x, topRight.y);
        const stepSizeX = videoSize.x / canvasSize.x;
        const stepSizeY = videoSize.y / canvasSize.y;

        if (ENV.development) {
            console.log('FrameGrabber', JSON.stringify({
                videoSize: grayImageArray.shape,
                canvasSize: canvasImageArray.shape,
                stepSize: [stepSizeX, stepSizeY],
                size: targetImageArray.shape,
                topRight,
            }));
        }

        /**
         * Uses the given array as frame-buffer
         */
        const frameGrabber: IFrameGrabber = {
            attachData(data) {
                internalData = data;
            },

            /**
             * Returns the used frame-buffer
             */
            getData() {
                return internalData;
            },

            /**
             * Fetches a frame from the input-stream and puts into the frame-buffer.
             * The image-data is converted to gray-scale and then half-sampled if configured.
             */
            grab() {
                const frame = inputStream.getFrame() as IFrame;

                if (frame) {
                    this.scaleAndCrop(frame);
                    return true;
                }
                return false;
            },

            // eslint-disable-next-line
            scaleAndCrop: function(frame) {
                // 1. compute full-sized gray image
                computeGray(frame.data, grayData);

                // 2. interpolate
                for (let y = 0; y < canvasSize.y; y++) {
                    for (let x = 0; x < canvasSize.x; x++) {
                        // eslint-disable-next-line no-bitwise, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                        canvasImageArray.set(x, y, (Interp2D(grayImageArray, x * stepSizeX, y * stepSizeY)) | 0);
                    }
                }

                // targetImageArray must be equal to targetSize
                // eslint-disable-next-line no-bitwise, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                if (targetImageArray.shape[0] !== size.x
                    // eslint-disable-next-line no-bitwise, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                    || targetImageArray.shape[1] !== size.y) {
                    throw new Error('Shapes do not match!');
                }

                // 3. crop
                for (let y = 0; y < size.y; y++) {
                    for (let x = 0; x < size.x; x++) {
                        // eslint-disable-next-line no-bitwise, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                        internalData[y * size.x + x] = targetImageArray.get(x, y);
                    }
                }
            },

            getSize() {
                return size;
            },
        };

        return frameGrabber;
    },
};

export default Factory;
