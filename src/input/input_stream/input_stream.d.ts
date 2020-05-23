import { XYSize, Point } from '../../../type-definitions/quagga.d';

type EventHandler = (arg?: any) => void;

export type EventHandlerList = {
    [index: string]: Array<EventHandler>;
};

export interface InputStream {
    getRealWidth(): number;
    getRealHeight(): number;
    getWidth(): number;
    getHeight(): number;
    setWidth(width: number): void;
    setHeight(height: number): void;
    setInputStream(config: any): void;
    ended(): boolean;
    getConfig(): any;
    setAttribute(name: any, value: any): void;
    pause(): void;
    play(): void;
    setCurrentTime(time: number): void;
    addEventListener(event: string, f: (args?: any) => void, bool: boolean): void;
    clearEventHandlers(): void;
    trigger(eventName: any, args: any): void;
    setTopRight(topRight: Point): void;
    getTopRight(): Point;
    setCanvasSize(size: XYSize): void;
    getCanvasSize(): XYSize;
    getFrame(): any;
}

type VideoStreamFactory = (video: HTMLVideoElement) => InputStream;
type LiveStreamFactory = (video: HTMLVideoElement) => InputStream;
type ImageStreamFactory = () => InputStream;

export interface InputStreamFactory {
    createVideoStream: VideoStreamFactory;
    createLiveStream: LiveStreamFactory;
    createImageStream: ImageStreamFactory;
}
