/* eslint-disable @typescript-eslint/no-explicit-any */

import { XYSize, Point } from '../../../type-definitions/quagga.d';
import ImageLoader from '../image_loader';
import {
    InputStreamFactory, InputStream, EventHandlerList, EventName, EVENTNAMES,
} from './input_stream_base';

const inputStreamFactory: InputStreamFactory = {
    createVideoStream(video): InputStream {
        let videoStreamConfig: { size: number; type: string } | null = null;
        const EventHandlers: EventHandlerList = {};
        let calculatedWidth: number;
        let calculatedHeight: number;
        const topRight: Point = { x: 0, y: 0, type: 'Point' };
        const canvasSize: XYSize = { x: 0, y: 0, type: 'XYSize' };

        function initSize(): void {
            const width = video.videoWidth;
            const height = video.videoHeight;

            if (videoStreamConfig?.size) {
                if (width / height > 1) {
                    calculatedWidth = videoStreamConfig.size;
                } else {
                    calculatedWidth = Math.floor((width / height) * videoStreamConfig.size);
                }
            } else {
                calculatedWidth = width;
            }

            if (videoStreamConfig?.size) {
                if (width / height > 1) {
                    calculatedHeight = Math.floor((height / width) * videoStreamConfig.size);
                } else {
                    calculatedHeight = videoStreamConfig.size;
                }
            } else {
                calculatedHeight = height;
            }

            canvasSize.x = calculatedWidth;
            canvasSize.y = calculatedHeight;
        }
        const inputStream: InputStream = {
            getRealWidth() {
                return video.videoWidth;
            },

            getRealHeight() {
                return video.videoHeight;
            },

            getWidth() {
                return calculatedWidth;
            },

            getHeight() {
                return calculatedHeight;
            },

            setWidth(width) {
                calculatedWidth = width;
            },

            setHeight(height) {
                calculatedHeight = height;
            },

            setInputStream(config) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                videoStreamConfig = config;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                this.setAttribute('src', (typeof config.src !== 'undefined') ? config.src : '');
            },

            ended() {
                return video.ended;
            },

            getConfig() {
                return videoStreamConfig;
            },

            setAttribute(name: string, value: string) {
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
                if (videoStreamConfig?.type !== 'LiveStream') {
                    this.setAttribute('currentTime', time.toString());
                }
            },

            addEventListener(event: EventName, f: EventListener, bool?: boolean | EventListenerOptions) {
                if (EVENTNAMES.indexOf(event) !== -1) {
                    if (!EventHandlers[event]) {
                        EventHandlers[event] = [];
                    }
                    EventHandlers[event]?.push(f);
                } else {
                    video.addEventListener(event, f, bool);
                }
            },

            clearEventHandlers() {
                EVENTNAMES.forEach((eventName) => {
                    const handlers = EventHandlers[eventName];
                    if (handlers && handlers.length > 0) {
                        handlers.forEach((handler) => {
                            video.removeEventListener(eventName, handler);
                        });
                    }
                });
            },

            trigger(eventName: EventName, args) {
                let j;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const handlers = EventHandlers[eventName];

                if (eventName === 'canrecord') {
                    initSize();
                }
                if (handlers && handlers.length > 0) {
                    for (j = 0; j < handlers.length; j++) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        handlers[j].apply(inputStream, args);
                    }
                }
            },

            setTopRight(newTopRight: Point) {
                topRight.x = newTopRight.x;
                topRight.y = newTopRight.y;
            },

            getTopRight() {
                return topRight;
            },

            setCanvasSize(size) {
                canvasSize.x = size.x;
                canvasSize.y = size.y;
            },

            getCanvasSize() {
                return canvasSize;
            },

            getFrame() {
                return video;
            },
        };
        return inputStream;
    },
    createLiveStream(video): InputStream {
        console.warn('**** InputStreamBrowser createLiveStream');
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
        let imageStreamConfig: { sequence: any; size: number; } | null = null;

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
        const EventHandlers: EventHandlerList = {};
        const topRight: Point = { x: 0, y: 0, type: 'Point' };
        const canvasSize: XYSize = { x: 0, y: 0, type: 'XYSize' };

        function loadImages(): void {
            loaded = false;
            ImageLoader.load(baseUrl, (imgs: Array<{ img: HTMLImageElement; tags: any; }>) => {
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

                if (imageStreamConfig?.size) {
                    if (width / height > 1) {
                        calculatedWidth = imageStreamConfig.size;
                    } else {
                        calculatedWidth = Math.floor((width / height) * imageStreamConfig.size);
                    }
                } else {
                    calculatedWidth = width;
                }

                if (imageStreamConfig?.size) {
                    if (width / height > 1) {
                        calculatedHeight = Math.floor((height / width) * imageStreamConfig.size);
                    } else {
                        calculatedHeight = imageStreamConfig.size;
                    }
                } else {
                    calculatedHeight = height;
                }

                canvasSize.x = calculatedWidth;
                canvasSize.y = calculatedHeight;
                loaded = true;
                frameIdx = 0;
                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    publishEvent('canrecord', []);
                }, 0);
            }, offset, size, imageStreamConfig?.sequence);
        }

        function publishEvent(eventName: EventName, args: Array<any>): void {
            let j;
            const handlers = EventHandlers[eventName];

            if (handlers && handlers.length > 0) {
                for (j = 0; j < handlers.length; j++) {
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define, max-len, @typescript-eslint/no-unsafe-argument
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
                imageStreamConfig = stream;
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
                EVENTNAMES.forEach((ind) => delete EventHandlers[ind]);
            },

            setTopRight(newTopRight: Point) {
                topRight.x = newTopRight.x;
                topRight.y = newTopRight.y;
            },

            getTopRight() {
                return topRight;
            },

            setCanvasSize(newCanvasSize: XYSize) {
                canvasSize.x = newCanvasSize.x;
                canvasSize.y = newCanvasSize.y;
            },

            getCanvasSize() {
                return canvasSize;
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
