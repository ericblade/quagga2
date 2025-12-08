const Bresenham = {};

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
Bresenham.getBarcodeLine = function (imageWrapper, p1, p2) {
    /* eslint-disable no-bitwise */
    let x0 = p1.x | 0;
    let y0 = p1.y | 0;
    let x1 = p2.x | 0;
    let y1 = p2.y | 0;
    /* eslint-disable no-bitwise */
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    let error;
    let y;
    let tmp;
    let x;
    const line = [];
    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    let val;
    let min = 255;
    let max = 0;

    function read(a, b) {
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
};

/**
 * Converts the result from getBarcodeLine into a binary representation
 * also considering the frequency and slope of the signal for more robust results
 * @param {Object} result {line, min, max}
 */
Bresenham.toBinaryLine = function (result) {
    const { min } = result;
    const { max } = result;
    const { line } = result;
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

    // Debug output for pharmacode
    const isPharmacodeTest = process.env.NODE_ENV === 'test' && line.length === 804;
    if (isPharmacodeTest) {
        console.log(`[DEBUG] toBinaryLine: line.length=${line.length}, min=${min}, max=${max}, center=${center}, threshold=${threshold}`);
    }

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

    if (isPharmacodeTest) {
        console.log(`[DEBUG] toBinaryLine: found ${extrema.length} extrema at positions: ${extrema.map(e => `${e.pos}(${e.val})`).join(',')}`);
    }

    for (j = extrema[0].pos; j < extrema[1].pos; j++) {
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
            line[j] = line[j] > threshold ? 0 : 1;
        }
    }

    return {
        line,
        threshold,
    };
};

/**
 * Used for development only
 */
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

export default Bresenham;
