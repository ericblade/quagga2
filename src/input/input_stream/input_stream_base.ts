import { XYSize, Point } from '../../../type-definitions/quagga';

export type EventName = 'canrecord' | 'ended';

export type EventHandlerList = {
    [key in EventName]?: Array<EventListener>;
};

export interface InputStream {
    addEventListener(event: string, f: EventListener, bool?: boolean): void;
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
    trigger(eventName: EventName, args?: any): void;
}

type VideoStreamFactory = (video: HTMLVideoElement) => InputStream;
type LiveStreamFactory = (video: HTMLVideoElement) => InputStream;
type ImageStreamFactory = () => InputStream;

export interface InputStreamFactory {
    createImageStream: ImageStreamFactory;
    createLiveStream: LiveStreamFactory;
    createVideoStream: VideoStreamFactory;
}

export const EVENTNAMES: ReadonlyArray<EventName> = ['canrecord', 'ended'] as const;
