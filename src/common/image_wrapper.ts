import { hsv2rgb } from './cv_utils';
import ArrayHelper from '../common/array_helper';
import { clone } from 'gl-vec2';
import { XYSize, TypedArrayConstructor, TypedArray } from '../../type-definitions/quagga';
const vec2 = { clone };

declare interface moment {
    m00: number,
    m01: number,
    m10: number,
    m11: number,
    m02: number,
    m20: number,
    theta: number,
    rad: number,
    vec?: Array<number>
}

class ImageWrapper {
    data: TypedArray | Array<number>;
    size: XYSize;
    indexMapping?: {
        x: Array<number>,
        y: Array<number>,
    };

    // Represents a basic image combining the data and size. In addition, some methods for
    // manipulation are contained within.
    constructor(size: XYSize, data?: TypedArray | Array<number>, ArrayType: TypedArrayConstructor | ArrayConstructor = Uint8Array, initialize?: boolean) {
        if (!data) {
            this.data = new (ArrayType)(size.x * size.y);
            if (initialize) {
                ArrayHelper.init(this.data, 0);
            }
        } else {
            this.data = data;
        }
        this.size = size;
    }

    // tests if a position is within the image with a given offset
    inImageWithBorder(imgRef: XYSize, border: number) {
        return (imgRef.x >= border)
            && (imgRef.y >= border)
            && (imgRef.x < (this.size.x - border))
            && (imgRef.y < (this.size.y - border));
    }

    // Copy from the top-left from location of this image to the ImageWrapper provided, up to the
    // size in the new ImageWrapper. Note that if the area from (x, y) to (size.x, size.y) is larger
    // than THIS image, bad/undefined things may happen.
    subImageAsCopy(imageWrapper: ImageWrapper, from: XYSize) {
        const { x: sizeX, y: sizeY } = imageWrapper.size;
        for(let x = 0; x < sizeX; x++) {
            for(let y = 0; y < sizeY; y++) {
                imageWrapper.data[y * sizeX + x] = this.data[(from.y + y) * this.size.x + from.x + x];
            }
        }
        return imageWrapper;
        // TODO: this function really probably should call into ImageWrapper somewhere to make
        // sure that all of it's parameters are set properly, something like
        // ImageWrapper.UpdateFrom()
        // that might take a provided data and size, and make sure there's no invalid indexMapping
        // hanging around, and such.
    }

    // Retrieve a grayscale value at the given pixel position of the image
    get(x: number, y: number) {
        return this.data[y * this.size.x + x];
    }

    // Retrieve a grayscale value at the given pixel position of the image (safe, whatever that
    // means)
    getSafe(x: number, y: number) {
        // cache indexMapping because if we're using it once, we'll probably need it a bunch more
        // too
        if (!this.indexMapping) {
            this.indexMapping = {
                x: new Array(),
                y: new Array(),
            };
            for(let i = 0; i < this.size.x; i++) {
                this.indexMapping.x[i] = i;
                this.indexMapping.x[i + this.size.x] = i;
            }
            for(let i = 0; i < this.size.y; i++) {
                this.indexMapping.y[i] = i;
                this.indexMapping.y[i + this.size.y] = i;
            }
        }
        return this.data[(this.indexMapping.y[y + this.size.y]) * this.size.x + this.indexMapping.x[x + this.size.x]];
    }

    // Sets a given pixel position in the image to the given grayscale value
    set(x: number, y: number, value: number) {
        this.data[y * this.size.x + x] = value;
        delete this.indexMapping;
        return this;
    }

    // Sets the border of the image (1 pixel) to zero
    zeroBorder() {
        const { x: width, y: height } = this.size;
        for (let i = 0; i < width; i++) {
            this.data[i] = this.data[(height - 1) * width + i] = 0;
        }
        for (let i = 1; i < height - 1; i++) {
            this.data[i * width] = this.data[i * width + (width - 1)] = 0;
        }
        delete this.indexMapping;
        return this;
    }

    // TODO: this function is entirely too large for me to reason out right at this moment that i'm handling
    // all the rest of it, so this is a verbatim copy of the javascript source, with only tweaks
    // necessary to get it to run, no thought put into it yet.
    moments(labelcount: any) {
        var data = this.data,
            x,
            y,
            height = this.size.y,
            width = this.size.x,
            val,
            ysq,
            labelsum: Array<moment> = [],
            i,
            label,
            mu11,
            mu02,
            mu20,
            x_,
            y_,
            tmp,
            result: Array<moment> = [],
            PI = Math.PI,
            PI_4 = PI / 4;

        if (labelcount <= 0) {
            return result;
        }

        for (i = 0; i < labelcount; i++) {
            labelsum[i] = {
                m00: 0,
                m01: 0,
                m10: 0,
                m11: 0,
                m02: 0,
                m20: 0,
                theta: 0,
                rad: 0,
            };
        }

        for (y = 0; y < height; y++) {
            ysq = y * y;
            for (x = 0; x < width; x++) {
                val = data[y * width + x];
                if (val > 0) {
                    label = labelsum[val - 1];
                    label.m00 += 1;
                    label.m01 += y;
                    label.m10 += x;
                    label.m11 += x * y;
                    label.m02 += ysq;
                    label.m20 += x * x;
                }
            }
        }

        for (i = 0; i < labelcount; i++) {
            label = labelsum[i];
            if (!isNaN(label.m00) && label.m00 !== 0) {
                x_ = label.m10 / label.m00;
                y_ = label.m01 / label.m00;
                mu11 = label.m11 / label.m00 - x_ * y_;
                mu02 = label.m02 / label.m00 - y_ * y_;
                mu20 = label.m20 / label.m00 - x_ * x_;
                tmp = (mu02 - mu20) / (2 * mu11);
                tmp = 0.5 * Math.atan(tmp) + (mu11 >= 0 ? PI_4 : -PI_4) + PI;
                label.theta = (tmp * 180 / PI + 90) % 180 - 90;
                if (label.theta < 0) {
                    label.theta += 180;
                }
                label.rad = tmp > PI ? tmp - PI : tmp;
                label.vec = vec2.clone([Math.cos(tmp), Math.sin(tmp)]);
                result.push(label);
            }
        }
        return result;
    }

    // return a Uint8ClampedArray containing this grayscale image converted to RGBA form
    getAsRGBA(scale: number = 1.0) {
        const ret = new Uint8ClampedArray(4 * this.size.x * this.size.y);
        for (let y = 0; y < this.size.y; y++) {
            for (let x = 0; x < this.size.x; x++) {
                const pixel = y * this.size.x + x;
                const current = this.get(x, y) * scale;
                ret[pixel * 4 + 0] = current;
                ret[pixel * 4 + 1] = current;
                ret[pixel * 4 + 2] = current;
                ret[pixel * 4 + 3] = 255;
            }
        }
        return ret;
    }

    // Display this ImageWrapper in a given Canvas element at the specified scale
    show(canvas: HTMLCanvasElement, scale: number = 1.0) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get canvas context');
        }
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = this.getAsRGBA(scale);
        canvas.width = this.size.x;
        canvas.height = this.size.y;
        const newFrame = new ImageData(data, frame.width, frame.height);
        ctx.putImageData(newFrame, 0, 0);
    }

    // Displays a specified SubImage area in a given canvas. This differs drastically from
    // creating a new SubImage and using it's show() method. Why? I don't have the answer to that
    // yet.  I suspect the HSV/RGB operations involved here are making it significantly different,
    // but until I can visualize these functions side by side, I'm just going to copy the existing
    // implementation.
    overlay(canvas: HTMLCanvasElement, scale: number, from: XYSize) {
        if (scale < 0 || scale > 360) {
            scale = 360;
        }
        var hsv = [0, 1, 1];
        var rgb = [0, 0, 0];
        var whiteRgb = [255, 255, 255];
        var blackRgb = [0, 0, 0];
        var result = [];
        var ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get canvas context');
        }
        var frame = ctx.getImageData(from.x, from.y, this.size.x, this.size.y);
        var data = frame.data;
        var length = this.data.length;
        while (length--) {
            hsv[0] = this.data[length] * scale;
            result = hsv[0] <= 0 ? whiteRgb : hsv[0] >= 360 ? blackRgb : hsv2rgb(hsv, rgb);
            data[length * 4 + 0] = result[0];
            data[length * 4 + 1] = result[1];
            data[length * 4 + 2] = result[2];
            data[length * 4 + 3] = 255;
        }
        ctx.putImageData(frame, from.x, from.y);
    }
}

export default ImageWrapper;
