// TODO: It's pretty likely that this shares code with the browser version, investigate that
// FOR ANYONE IN HERE IN THE FUTURE: This is the default input_stream module used for the Node bundle.
// webpack.config.js *replaces* this with input_stream_browser.ts when the bundle is being built for browser.

import GetPixels from 'get-pixels';
import { Point, XYSize } from '../../../type-definitions/quagga.d';
import {
    InputStreamFactory, InputStream, EventHandlerList, EventName, EVENTNAMES,
} from './input_stream_base';

const inputStreamFactory: InputStreamFactory = {
    createVideoStream(): never {
        throw new Error('createVideoStream not available');
    },
    createLiveStream(): never {
        throw new Error('createLiveStream not available');
    },
    createImageStream(): InputStream {
        let imageStreamConfig: { mime: string; size: number; src: any } | null = null;

        let width = 0;
        let height = 0;
        let loaded = false;
        // TODO: frame should be a type NdArray, but NdArray doesn't have ts definitions
        // TODO: there is a ts-ndarray that might work, though
        let frame: any = null;
        let baseUrl: string;
        const ended = false;
        let calculatedWidth: number;
        let calculatedHeight: number;
        const EventHandlers: EventHandlerList = {};
        const topRight: Point = { x: 0, y: 0, type: 'Point' };
        const canvasSize: XYSize = { x: 0, y: 0, type: 'XYSize' };
        /* eslint-disable no-unused-vars */ // false eslint errors? weird.
        // @ts-ignore
        let size = 0;
        // @ts-ignore
        let frameIdx = 0;
        // @ts-ignore
        let paused = false;
        /* eslint-enable no-unused-vars */

        function loadImages(): void {
            loaded = false;
            /* eslint-disable new-cap */
            GetPixels(baseUrl, imageStreamConfig?.mime, (err, pixels) => {
                if (err) {
                    console.error('**** quagga loadImages error:', err);
                    throw new Error('error decoding pixels in loadImages');
                }
                loaded = true;
                if (ENV.development) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    console.log('* InputStreamNode pixels.shape', pixels?.shape);
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                frame = pixels;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                [width, height] = pixels.shape;
                // eslint-disable-next-line no-nested-ternary
                calculatedWidth = imageStreamConfig?.size
                    ? width / height > 1
                        ? imageStreamConfig.size
                        : Math.floor((width / height) * imageStreamConfig.size)
                    : width;
                // eslint-disable-next-line no-nested-ternary
                calculatedHeight = imageStreamConfig?.size
                    ? width / height > 1
                        ? Math.floor((height / width) * imageStreamConfig.size)
                        : imageStreamConfig.size
                    : height;

                canvasSize.x = calculatedWidth;
                canvasSize.y = calculatedHeight;

                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    publishEvent('canrecord', [new Event('canrecord')]);
                }, 0);
            });
        }

        function publishEvent(eventName: EventName, args: [evt: Event]): void {
            const handlers = EventHandlers[eventName];

            if (handlers && handlers.length > 0) {
                for (let j = 0; j < handlers.length; j++) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    handlers[j].apply(inputStream, args);
                }
            }
        }

        // eslint-disable-next-line no-var,vars-on-top
        var inputStream: InputStream = {
            trigger: publishEvent,

            getWidth() {
                return calculatedWidth;
            },

            getHeight() {
                return calculatedHeight;
            },

            setWidth(w) {
                calculatedWidth = w;
            },

            setHeight(h) {
                calculatedHeight = h;
            },

            getRealWidth() {
                return width;
            },

            getRealHeight() {
                return height;
            },

            setInputStream(stream) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                imageStreamConfig = stream;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                baseUrl = imageStreamConfig?.src;
                size = 1;
                loadImages();
            },

            ended() {
                return ended;
            },

            setAttribute() {},

            getConfig() {
                return imageStreamConfig;
            },

            pause() {
                paused = true;
            },

            play() {
                paused = false;
            },

            setCurrentTime(time) {
                frameIdx = time;
            },

            addEventListener(event: EventName, f) {
                if (EVENTNAMES.indexOf(event) !== -1) {
                    if (!EventHandlers[event]) {
                        EventHandlers[event] = [];
                    }
                    EventHandlers[event]?.push(f);
                }
            },

            clearEventHandlers() {
                EVENTNAMES.forEach((ev) => delete EventHandlers[ev]);
            },

            setTopRight(newTopRight) {
                topRight.x = newTopRight.x;
                topRight.y = newTopRight.y;
            },

            getTopRight() {
                return topRight;
            },

            setCanvasSize(sz) {
                canvasSize.x = sz.x;
                canvasSize.y = sz.y;
            },

            getCanvasSize() {
                return canvasSize;
            },

            getFrame() {
                if (!loaded) {
                    return null;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return frame;
            },
        };
        return inputStream;
    },
};

export default inputStreamFactory;
