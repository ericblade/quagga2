// eslint-disable-next-line max-classes-per-file
import { InputStream } from 'input/input_stream/input_stream_base';
import { QuaggaJSConfigObject } from '../type-definitions/quagga';
import ImageWrapper from './common/image_wrapper';

export class CanvasInfo {
    image: any;

    overlay: any;
}

export class CanvasContainer {
    public readonly ctx: CanvasInfo;

    public readonly dom: CanvasInfo;

    constructor() {
        this.ctx = new CanvasInfo();
        this.dom = new CanvasInfo();
    }
}

export class QuaggaContext {
    public config?: QuaggaJSConfigObject;

    public inputStream!: InputStream;

    public framegrabber: any;

    public inputImageWrapper?: ImageWrapper;

    public stopped = false;

    public boxSize: any;

    public resultCollector: any;

    public decoder: any;

    public onUIThread = true;

    public readonly canvasContainer = new CanvasContainer();
}
