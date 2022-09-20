// TODO: It's pretty likely that this shares code with the browser version, investigate that
// FOR ANYONE IN HERE IN THE FUTURE: This is the default input_stream module used for the Node bundle.
// webpack.config.js *replaces* this with input_stream_browser.ts when the bundle is being built for browser.

import GetPixels from 'get-pixels';
import { InputStreamFactory, InputStream, EventHandlerList } from './input_stream.d';
import { Point, XYSize } from '../../../type-definitions/quagga.d';

const inputStreamFactory: InputStreamFactory = {
    createVideoStream(): never {
        throw new Error('createVideoStream not available');
    },
    createLiveStream(): never {
        throw new Error('createLiveStream not available');
    },
    createImageStream(): InputStream {
        // console.warn('* InputStreamNode createImageStream');
        let _config: { mime: string; size: number; src: any } | null = null;

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
        const _eventNames = ['canrecord', 'ended'];
        const _eventHandlers: EventHandlerList = {};
        const _topRight: Point = { x: 0, y: 0, type: 'Point' };
        const _canvasSize: XYSize = { x: 0, y: 0, type: 'XYSize' };
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
            GetPixels(baseUrl, _config?.mime, (err, pixels) => {
                if (err) {
                    console.error('**** quagga loadImages error:', err);
                    throw new Error('error decoding pixels in loadImages');
                }
                loaded = true;
                if (ENV.development) {
                    console.log('* InputStreamNode pixels.shape', pixels.shape);
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                frame = pixels;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                [width, height] = pixels.shape;
                // eslint-disable-next-line no-nested-ternary
                calculatedWidth = _config?.size
                    ? width / height > 1
                        ? _config.size
                        : Math.floor((width / height) * _config.size)
                    : width;
                // eslint-disable-next-line no-nested-ternary
                calculatedHeight = _config?.size
                    ? width / height > 1
                        ? Math.floor((height / width) * _config.size)
                        : _config.size
                    : height;

                _canvasSize.x = calculatedWidth;
                _canvasSize.y = calculatedHeight;

                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    publishEvent('canrecord', []);
                }, 0);
            });
        }

        function publishEvent(eventName: string, args: Array<any>): void {
            const handlers = _eventHandlers[eventName];

            if (handlers && handlers.length > 0) {
                for (let j = 0; j < handlers.length; j++) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    handlers[j].apply(inputStream, args as any);
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
                _config = stream;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                baseUrl = _config?.src;
                size = 1;
                loadImages();
            },

            ended() {
                return ended;
            },

            setAttribute() {},

            getConfig() {
                return _config;
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

            addEventListener(event, f) {
                if (_eventNames.indexOf(event) !== -1) {
                    if (!_eventHandlers[event]) {
                        _eventHandlers[event] = [];
                    }
                    _eventHandlers[event].push(f);
                }
            },

            clearEventHandlers() {
                Object.keys(_eventHandlers).forEach((ind) => delete _eventHandlers[ind]);
            },


            setTopRight(topRight) {
                _topRight.x = topRight.x;
                _topRight.y = topRight.y;
            },

            getTopRight() {
                return _topRight;
            },

            setCanvasSize(sz) {
                _canvasSize.x = sz.x;
                _canvasSize.y = sz.y;
            },

            getCanvasSize() {
                return _canvasSize;
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
