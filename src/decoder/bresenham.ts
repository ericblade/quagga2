/* eslint-disable no-bitwise */
import { ImageWrapper } from 'quagga';
import { Point } from '../../type-definitions/quagga';
// import { dist } from 'gl-vec2';

// TODO: would it be faster/more correct to ensure that our incoming points are integers already?
// how do they even get to be dumb floats?

// DDA line tracing from http://www.edepot.com/linedda.html
// algorithm slightly slower than Bresenham, but can allocate the entire array in advance and
// overall saves time. Accuracy appears unchanged or better.
export function getBarcodeLineDDA(imageWrapper: ImageWrapper, p1: Point, p2: Point) {
    const x = p1.x | 0;
    const y = p1.y | 0;
    const x2 = p2.x | 0;
    const y2 = p2.y | 0;
    let length = Math.abs(x2 - x);
    if (Math.abs(y2 - y) > length) length = Math.abs(y2 - y);
    const xinc = (x2 - x) / length;
    const yinc = (y2 - y) / length;

    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    const line: Array<number> = new Array(length) as Array<number>;
    line.fill(0);
    let min = 255;
    let max = 0;
    let counter = 0;

    function setPixel(a: number, b: number) {
        const value = imageData[b * width + a];
        min = Math.min(min, value);
        max = Math.max(max, value);
        line[counter] = value;
        counter += 1;
    }

    let thisX = x + 0.5;
    let thisY = y + 0.5;
    for (let i = 1; i <= length; ++i) {
        setPixel(thisX | 0, thisY | 0);
        thisX += xinc;
        thisY += yinc;
    }
    return {
        line,
        min,
        max,
    };
}

// EFLA-D method is faster overall, but fails on 4 more tests than Bresenham's
export function getBarcodeLineEFLAD(imageWrapper: ImageWrapper, p1: Point, p2: Point, accuracyBits = 16) {
    const x = p1.x | 0;
    const y = p1.y | 0;
    const x2 = p2.x | 0;
    const y2 = p2.y | 0;

    let shortLen = y2 - y;
    let longLen = x2 - x;
    const yLonger = Math.abs(shortLen) > Math.abs(longLen);
    if (yLonger) {
        [shortLen, longLen] = [longLen, shortLen];
    }
    const endVal = longLen;
    const incrementVal = longLen < 0 ? -1 : 1;
    if (incrementVal === -1) {
        longLen = -longLen;
    }
    const decInc = (longLen === 0) ? 0 : (shortLen << accuracyBits) / longLen;

    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    // eslint-disable-next-line no-bitwise
    // const distance = Math.ceil(dist([x, y], [x2, y2]));
    const line: Array<number> = new Array(Math.abs(endVal)) as Array<number>;
    let min = 255;
    let max = 0;
    let counter = 0;

    function setPixel(a: number, b: number) {
        const value = imageData[b * width + a];
        min = Math.min(min, value);
        max = Math.max(max, value);
        line[counter] = value;
        counter += 1;
    }

    let j = 0;
    if (yLonger) {
        for (let i = 0; i !== endVal; i += incrementVal) {
            // eslint-disable-next-line no-bitwise
            setPixel(x + (j >> accuracyBits), y + i);
            j += decInc;
        }
    } else {
        for (let i = 0; i !== endVal; i += incrementVal) {
            // eslint-disable-next-line no-bitwise
            setPixel(x + i, y + (j >> accuracyBits));
            j += decInc;
        }
    }

    return {
        line,
        min,
        max,
    };
}

// this version is slightly more true to Bresenham's original,
// almost immeasureably faster than the original implementation below this.
export function getBarcodeLineNew(imageWrapper: ImageWrapper, p1: Point, p2: Point) {
    let { x: x0, y: y0 } = p1;
    let { x: x1, y: y1 } = p2;
    // eslint-disable-next-line no-bitwise
    x0 |= 0; x1 |= 0; y0 |= 0; y1 |= 0;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;

    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;

    let err = dx - dy;
    let min = 255;
    let max = 0;
    const line: Array<number> = [];

    function setPixel(a: number, b: number) {
        const value = imageData[b * width + a];
        min = value < min ? value : min;
        max = value > max ? value : max;
        line.push(value);
    }
    while (true) {
        setPixel(x0, y0);
        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx; y0 += sy;
        }
    }
    return {
        line,
        min,
        max,
    };
}
const Slope = {
    DIR: {
        UP: 1,
        DOWN: -1,
    },
};
/**
 * Scans a line of the given image from point p1 to p2 and returns a result object containing
 * gray-scale values (0-255) of the underlying pixels in addition to the min
 * and max values.
 * @param {Object} imageWrapper
 * @param {Object} p1 The start point {x,y}
 * @param {Object} p2 The end point {x,y}
 * @returns {line, min, max}
 */
export function getBarcodeLine(imageWrapper: ImageWrapper, p1: Point, p2: Point) {
    let { x: x0, y: y0 } = p1;
    let { x: x1, y: y1 } = p2;

    // eslint-disable-next-line no-bitwise
    x0 |= 0; x1 |= 0; y0 |= 0; y1 |= 0;
    // unsure why truncate doesn't work identical to |= 0 above.

    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    let error;
    let y;
    let tmp;
    let x;
    const line: Array<number> = [];
    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    let val;
    let min = 255;
    let max = 0;

    function read(a: number, b: number) {
        val = imageData[b * width + a];
        min = val < min ? val : min;
        max = val > max ? val : max;
        line.push(val);
    }

    if (steep) {
        tmp = x0;
        x0 = y0;
        y0 = tmp;

        tmp = x1;
        x1 = y1;
        y1 = tmp;
    }
    if (x0 > x1) {
        tmp = x0;
        x0 = x1;
        x1 = tmp;

        tmp = y0;
        y0 = y1;
        y1 = tmp;
    }
    const deltaX = x1 - x0;
    const deltaY = Math.abs(y1 - y0);
    error = (deltaX / 2) | 0;
    y = y0;
    const yStep = y0 < y1 ? 1 : -1;
    for (x = x0; x < x1; x++) {
        if (steep) {
            read(y, x);
        } else {
            read(x, y);
        }
        error -= deltaY;
        if (error < 0) {
            y += yStep;
            error += deltaX;
        }
    }

    return {
        line,
        min,
        max,
    };
}

/**
 * Converts the result from getBarcodeLine into a binary representation
 * also considering the frequency and slope of the signal for more robust results
 * @param {Object} result {line, min, max}
 */
interface ToBinaryLineParams {
    line: Array<number>,
    max: number,
    min: number,
}

export function toBinaryLine({ line, max, min }: ToBinaryLineParams) {
    let slope;
    let slope2;
    const center = min + (max - min) / 2;
    const extrema = [];
    let currentDir;
    let dir;
    let threshold = (max - min) / 12;
    const rThreshold = -threshold;
    let i;
    let j;

    // 1. find extrema
    currentDir = line[0] > center ? Slope.DIR.UP : Slope.DIR.DOWN;
    extrema.push({
        pos: 0,
        val: line[0],
    });
    for (i = 0; i < line.length - 2; i++) {
        slope = (line[i + 1] - line[i]);
        slope2 = (line[i + 2] - line[i + 1]);
        if ((slope + slope2) < rThreshold && line[i + 1] < (center * 1.5)) {
            dir = Slope.DIR.DOWN;
        } else if ((slope + slope2) > threshold && line[i + 1] > (center * 0.5)) {
            dir = Slope.DIR.UP;
        } else {
            dir = currentDir;
        }

        if (currentDir !== dir) {
            extrema.push({
                pos: i,
                val: line[i],
            });
            currentDir = dir;
        }
    }
    extrema.push({
        pos: line.length,
        val: line[line.length - 1],
    });

    for (j = extrema[0].pos; j < extrema[1].pos; j++) {
        // eslint-disable-next-line no-param-reassign
        line[j] = line[j] > center ? 0 : 1;
    }

    // iterate over extrema and convert to binary based on avg between minmax
    for (i = 1; i < extrema.length - 1; i++) {
        if (extrema[i + 1].val > extrema[i].val) {
            threshold = (extrema[i].val + ((extrema[i + 1].val - extrema[i].val) / 3) * 2) | 0;
        } else {
            threshold = (extrema[i + 1].val + ((extrema[i].val - extrema[i + 1].val) / 3)) | 0;
        }

        for (j = extrema[i].pos; j < extrema[i + 1].pos; j++) {
            // eslint-disable-next-line no-param-reassign
            line[j] = line[j] > threshold ? 0 : 1;
        }
    }

    return {
        line,
        threshold,
    };
}

/**
 * Used for development only
 */
/*
Bresenham.debug = {
    printFrequency(line, canvas) {
        let i;
        const ctx = canvas.getContext('2d');
        // eslint-disable-next-line no-param-reassign
        canvas.width = line.length;
        // eslint-disable-next-line no-param-reassign
        canvas.height = 256;

        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        for (i = 0; i < line.length; i++) {
            ctx.moveTo(i, 255);
            ctx.lineTo(i, 255 - line[i]);
        }
        ctx.stroke();
        ctx.closePath();
    },

    printPattern(line, canvas) {
        const ctx = canvas.getContext('2d'); let
            i;

        // eslint-disable-next-line no-param-reassign
        canvas.width = line.length;
        ctx.fillColor = 'black';
        for (i = 0; i < line.length; i++) {
            if (line[i] === 1) {
                ctx.fillRect(i, 0, 1, 100);
            }
        }
    },
};
*/
