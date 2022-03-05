import { XYSize, Point } from '../../../type-definitions/quagga.d';

type EventHandler = (arg?: any) => void;

export type EventHandlerList = {
    [index: string]: Array<EventHandler>;
};

export interface InputStream {
    addEventListener(event: string, f: (args?: any) => void, bool: boolean): void;
    clearEventHandlers(): void;
    ended(): boolean;
    getCanvasSize(): XYSize;
    getConfig(): any;
    getFrame(): any;
    getHeight(): number;
    getRealHeight(): number;
    getRealWidth(): number;
    getTopRight(): Point;
    getWidth(): number;
    pause(): void;
    play(): void;
    setAttribute(name: any, value: any): void;
    setCanvasSize(size: XYSize): void;
    setCurrentTime(time: number): void;
    setHeight(height: number): void;
    setInputStream(config: any): void;
    setTopRight(topRight: Point): void;
    setWidth(width: number): void;
    trigger(eventName: any, args: any): void;
}

type VideoStreamFactory = (video: HTMLVideoElement) => InputStream;
type LiveStreamFactory = (video: HTMLVideoElement) => InputStream;
type ImageStreamFactory = () => InputStream;

export interface InputStreamFactory {
    createImageStream: ImageStreamFactory;
    createLiveStream: LiveStreamFactory;
    createVideoStream: VideoStreamFactory;
}
