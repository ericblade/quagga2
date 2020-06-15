/* eslint-disable @typescript-eslint/no-explicit-any */

import ImageLoader from '../image_loader';
import { XYSize, Point } from '../../../type-definitions/quagga.d';
import { InputStreamFactory, InputStream, EventHandlerList } from './input_stream.d';

const inputStreamFactory: InputStreamFactory = {
    createVideoStream(video): InputStream {
        let _config: { size: number; type: string } | null = null;
        const _eventNames = ['canrecord', 'ended'];
        const _eventHandlers: EventHandlerList = {};
        let _calculatedWidth: number;
        let _calculatedHeight: number;
        const _topRight: Point = { x: 0, y: 0, type: 'Point' };
        const _canvasSize: XYSize = { x: 0, y: 0, type: 'XYSize' };

        function initSize(): void {
            const width = video.videoWidth;
            const height = video.videoHeight;

            // eslint-disable-next-line no-nested-ternary
            _calculatedWidth = _config?.size ? width / height > 1 ? _config.size : Math.floor((width / height) * _config.size) : width;
            // eslint-disable-next-line no-nested-ternary
            _calculatedHeight = _config?.size ? width / height > 1 ? Math.floor((height / width) * _config.size) : _config.size : height;

            _canvasSize.x = _calculatedWidth;
            _canvasSize.y = _calculatedHeight;
        }
        const inputStream: InputStream = {
            getRealWidth() {
                return video.videoWidth;
            },

            getRealHeight() {
                return video.videoHeight;
            },

            getWidth() {
                return _calculatedWidth;
            },

            getHeight() {
                return _calculatedHeight;
            },

            setWidth(width) {
                _calculatedWidth = width;
            },

            setHeight(height) {
                _calculatedHeight = height;
            },

            setInputStream(config) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                _config = config;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                this.setAttribute('src', (typeof config.src !== 'undefined') ? config.src : '');
            },

            ended() {
                return video.ended;
            },

            getConfig() {
                return _config;
            },

            setAttribute(name, value) {
                if (video) {
                    video.setAttribute(name, value);
                }
            },

            pause() {
                video.pause();
            },

            play() {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                video.play();
            },

            setCurrentTime(time) {
                if (_config?.type !== 'LiveStream') {
                    this.setAttribute('currentTime', time.toString());
                }
            },

            addEventListener(event, f, bool) {
                if (_eventNames.indexOf(event) !== -1) {
                    if (!_eventHandlers[event]) {
                        _eventHandlers[event] = [];
                    }
                    _eventHandlers[event].push(f);
                } else {
                    video.addEventListener(event, f, bool);
                }
            },

            clearEventHandlers() {
                _eventNames.forEach((eventName) => {
                    const handlers = _eventHandlers[eventName];
                    if (handlers && handlers.length > 0) {
                        handlers.forEach((handler) => {
                            video.removeEventListener(eventName, handler);
                        });
                    }
                });
            },

            trigger(eventName, args) {
                let j;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const handlers = _eventHandlers[eventName];

                if (eventName === 'canrecord') {
                    initSize();
                }
                if (handlers && handlers.length > 0) {
                    for (j = 0; j < handlers.length; j++) {
                        handlers[j].apply(inputStream, args);
                    }
                }
            },

            setTopRight(topRight) {
                _topRight.x = topRight.x;
                _topRight.y = topRight.y;
            },

            getTopRight() {
                return _topRight;
            },

            setCanvasSize(size) {
                _canvasSize.x = size.x;
                _canvasSize.y = size.y;
            },

            getCanvasSize() {
                return _canvasSize;
            },

            getFrame() {
                return video;
            },
        };
        return inputStream;
    },
    createLiveStream(video): InputStream {
        if (video) {
            video.setAttribute('autoplay', 'true');
        }
        const that = inputStreamFactory.createVideoStream(video);
        that.ended = function ended(): false {
            return false;
        };
        return that;
    },
    createImageStream(): InputStream {
        let _config: { size: number; sequence: any } | null = null;

        let width = 0;
        let height = 0;
        let frameIdx = 0;
        let paused = true;
        let loaded = false;
        let imgArray: any[] | null = null;
        let size = 0;
        const offset = 1;
        let baseUrl: string | null = null;
        let ended = false;
        let calculatedWidth: number;
        let calculatedHeight: number;
        const _eventNames = ['canrecord', 'ended'];
        const _eventHandlers: EventHandlerList = {};
        const _topRight: Point = { x: 0, y: 0, type: 'Point' };
        const _canvasSize: XYSize = { x: 0, y: 0, type: 'XYSize' };

        function loadImages(): void {
            loaded = false;
            ImageLoader.load(baseUrl, (imgs: Array<{ tags: any; img: HTMLImageElement}>) => {
                imgArray = imgs;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (imgs[0].tags && imgs[0].tags.orientation) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    switch (imgs[0].tags.orientation) {
                        case 6:
                        case 8:
                            width = imgs[0].img.height;
                            height = imgs[0].img.width;
                            break;
                        default:
                            width = imgs[0].img.width;
                            height = imgs[0].img.height;
                    }
                } else {
                    width = imgs[0].img.width;
                    height = imgs[0].img.height;
                }
                // eslint-disable-next-line no-nested-ternary
                calculatedWidth = _config?.size ? width / height > 1 ? _config.size : Math.floor((width / height) * _config.size) : width;
                // eslint-disable-next-line no-nested-ternary
                calculatedHeight = _config?.size ? width / height > 1 ? Math.floor((height / width) * _config.size) : _config.size : height;
                _canvasSize.x = calculatedWidth;
                _canvasSize.y = calculatedHeight;
                loaded = true;
                frameIdx = 0;
                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    publishEvent('canrecord', []);
                }, 0);
            }, offset, size, _config?.sequence);
        }

        function publishEvent(eventName: string, args: Array<any>): void {
            let j;
            const handlers = _eventHandlers[eventName];

            if (handlers && handlers.length > 0) {
                for (j = 0; j < handlers.length; j++) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    handlers[j].apply(inputStream, args as any); // TODO: typescript complains that any[] is not valid for a second arg for apply?!
                }
            }
        }

        // TODO: any code shared with the first InputStream above should be shared not copied
        // TODO: publishEvent needs access to inputStream, but inputStream needs access to publishEvent
        // TODO: This is why it's a 'var', so it hoists back.  This is ugly, and should be changed.
        // eslint-disable-next-line no-var,vars-on-top
        var inputStream: InputStream = {

            trigger: publishEvent,

            getWidth() {
                return calculatedWidth;
            },

            getHeight() {
                return calculatedHeight;
            },

            setWidth(newWidth) {
                calculatedWidth = newWidth;
            },

            setHeight(newHeight) {
                calculatedHeight = newHeight;
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (stream.sequence === false) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                    baseUrl = stream.src;
                    size = 1;
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                    baseUrl = stream.src;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                    size = stream.length;
                }
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

            setCanvasSize(canvasSize) {
                _canvasSize.x = canvasSize.x;
                _canvasSize.y = canvasSize.y;
            },

            getCanvasSize() {
                return _canvasSize;
            },

            getFrame() {
                let frame;

                if (!loaded) {
                    return null;
                }
                if (!paused) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    frame = imgArray?.[frameIdx];
                    if (frameIdx < (size - 1)) {
                        frameIdx++;
                    } else {
                        setTimeout(() => {
                            ended = true;
                            publishEvent('ended', []);
                        }, 0);
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return frame;
            },
        };
        return inputStream;
    },
};

export default inputStreamFactory;
