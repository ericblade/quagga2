import ImageWrapper from './image_wrapper';
import { ImageRef, SparseImageWrapper, XYSize } from '../../type-definitions/quagga.d';

// A window into a specific area of an ImageWrapper
export class SubImage {
    I: ImageWrapper | SparseImageWrapper;

    data: ImageWrapper['data'];

    originalSize: XYSize;

    from: ImageRef;

    size: XYSize;

    // Construct representing a part of another {ImageWrapper}. Shares data between the parent and
    // child. Returns a shared part of the original image.
    constructor(from: ImageRef, size: XYSize, I: SparseImageWrapper = { data: null, size }) {
        this.data = I.data as ImageWrapper['data'];
        this.originalSize = { ...size };
        this.I = I;
        this.from = { ...from };
        this.size = { ...size };
    }

    // Retrieves a given pixel position from the {SubImage}, returns the grayscale value at the position
    get(x: number, y: number): number {
        return this.data[(this.from.y + y) * this.originalSize.x + this.from.x + x];
    }

    // Displays the {SubImage} in a given canvas at a given scale
    show(canvas: HTMLCanvasElement, scale = 1.0): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get canvas context');
        }
        // eslint-disable-next-line no-param-reassign
        canvas.width = this.size.x;
        // eslint-disable-next-line no-param-reassign
        canvas.height = this.size.y;
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = frame;
        let current = 0;
        for (let y = 0; y < this.size.y; y++) {
            for (let x = 0; x < this.size.x; x++) {
                const pixel = y * this.size.x + x;
                current = this.get(x, y) * scale;
                data[pixel * 4 + 0] = current;
                data[pixel * 4 + 1] = current;
                data[pixel * 4 + 2] = current;
                data[pixel * 4 + 3] = 255;
            }
        }
        const newFrame = new ImageData(data, frame.width, frame.height);
        ctx.putImageData(newFrame, 0, 0);
    }

    // Updates the underlying data from a given {ImageWrapper}
    updateData(image: ImageWrapper): void {
        this.originalSize = image.size;
        this.data = image.data;
    }

    // Updates the position of the shared area, returns {this} for possible chaining
    updateFrom(from: ImageRef): SubImage {
        this.from = from;
        return this;
    }
}

export default SubImage;
