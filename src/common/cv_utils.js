/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
import { glMatrix, vec2, vec3 } from 'gl-matrix';
import ArrayHelper from './array_helper';
import Cluster2 from './cluster';

glMatrix.setMatrixArrayType(Array);

/**
 * @param x x-coordinate
 * @param y y-coordinate
 * @return ImageReference {x,y} Coordinate
 */
export function imageRef(x, y) {
    const that = {
        x,
        y,
        toVec2() {
            return vec2.clone([this.x, this.y]);
        },
        toVec3() {
            return vec3.clone([this.x, this.y, 1]);
        },
        round() {
            this.x = this.x > 0.0 ? Math.floor(this.x + 0.5) : Math.floor(this.x - 0.5);
            this.y = this.y > 0.0 ? Math.floor(this.y + 0.5) : Math.floor(this.y - 0.5);
            return this;
        },
    };
    return that;
}

/**
 * Computes an integral image of a given grayscale image.
 * @param imageDataContainer {ImageDataContainer} the image to be integrated
 */
export function computeIntegralImage2(imageWrapper, integralWrapper) {
    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    const height = imageWrapper.size.y;
    const integralImageData = integralWrapper.data;
    let sum = 0; let posA = 0; let posB = 0; let posC = 0; let posD = 0; let x; let
        y;

    // sum up first column
    posB = width;
    sum = 0;
    for (y = 1; y < height; y++) {
        sum += imageData[posA];
        integralImageData[posB] += sum;
        posA += width;
        posB += width;
    }

    posA = 0;
    posB = 1;
    sum = 0;
    for (x = 1; x < width; x++) {
        sum += imageData[posA];
        integralImageData[posB] += sum;
        posA++;
        posB++;
    }

    for (y = 1; y < height; y++) {
        posA = y * width + 1;
        posB = (y - 1) * width + 1;
        posC = y * width;
        posD = (y - 1) * width;
        for (x = 1; x < width; x++) {
            integralImageData[posA]
                += imageData[posA] + integralImageData[posB] + integralImageData[posC] - integralImageData[posD];
            posA++;
            posB++;
            posC++;
            posD++;
        }
    }
}

export function computeIntegralImage(imageWrapper, integralWrapper) {
    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    const height = imageWrapper.size.y;
    const integralImageData = integralWrapper.data;
    let sum = 0;

    // sum up first row
    for (let i = 0; i < width; i++) {
        sum += imageData[i];
        integralImageData[i] = sum;
    }

    for (let v = 1; v < height; v++) {
        sum = 0;
        for (let u = 0; u < width; u++) {
            sum += imageData[v * width + u];
            integralImageData[((v) * width) + u] = sum + integralImageData[(v - 1) * width + u];
        }
    }
}

export function thresholdImage(imageWrapper, threshold, targetWrapper) {
    if (!targetWrapper) {
        // eslint-disable-next-line no-param-reassign
        targetWrapper = imageWrapper;
    }
    const imageData = imageWrapper.data; let { length } = imageData; const
        targetData = targetWrapper.data;

    while (length--) {
        targetData[length] = imageData[length] < threshold ? 1 : 0;
    }
}

export function computeHistogram(imageWrapper, bitsPerPixel) {
    if (!bitsPerPixel) {
        // eslint-disable-next-line no-param-reassign
        bitsPerPixel = 8;
    }
    const imageData = imageWrapper.data;
    let { length } = imageData;
    const bitShift = 8 - bitsPerPixel;
    const bucketCnt = 1 << bitsPerPixel;
    const hist = new Int32Array(bucketCnt);

    while (length--) {
        hist[imageData[length] >> bitShift]++;
    }
    return hist;
}

export function sharpenLine(line) {
    let i;
    const { length } = line;
    let left = line[0];
    let center = line[1];
    let right;

    for (i = 1; i < length - 1; i++) {
        right = line[i + 1];
        //  -1 4 -1 kernel
        // eslint-disable-next-line no-param-reassign
        line[i - 1] = (((center * 2) - left - right)) & 255;
        left = center;
        center = right;
    }
    return line;
}

export function determineOtsuThreshold(imageWrapper, bitsPerPixel = 8) {
    let hist;
    const bitShift = 8 - bitsPerPixel;

    function px(init, end) {
        let sum = 0;
        for (let i = init; i <= end; i++) {
            sum += hist[i];
        }
        return sum;
    }

    function mx(init, end) {
        let sum = 0;

        for (let i = init; i <= end; i++) {
            sum += i * hist[i];
        }

        return sum;
    }

    function determineThreshold() {
        const vet = [0];
        let p1;
        let p2;
        let p12;
        let m1;
        let m2;
        let m12;
        const max = (1 << bitsPerPixel) - 1;

        hist = computeHistogram(imageWrapper, bitsPerPixel);
        for (let k = 1; k < max; k++) {
            p1 = px(0, k);
            p2 = px(k + 1, max);
            p12 = p1 * p2;
            if (p12 === 0) {
                p12 = 1;
            }
            m1 = mx(0, k) * p2;
            m2 = mx(k + 1, max) * p1;
            m12 = m1 - m2;
            vet[k] = m12 * m12 / p12;
        }
        return ArrayHelper.maxIndex(vet);
    }

    const threshold = determineThreshold();
    return threshold << bitShift;
}

export function otsuThreshold(imageWrapper, targetWrapper) {
    const threshold = determineOtsuThreshold(imageWrapper);

    thresholdImage(imageWrapper, threshold, targetWrapper);
    return threshold;
}

// local thresholding
export function computeBinaryImage(imageWrapper, integralWrapper, targetWrapper) {
    computeIntegralImage(imageWrapper, integralWrapper);

    if (!targetWrapper) {
        // eslint-disable-next-line no-param-reassign
        targetWrapper = imageWrapper;
    }
    const imageData = imageWrapper.data;
    const targetData = targetWrapper.data;
    const width = imageWrapper.size.x;
    const height = imageWrapper.size.y;
    const integralImageData = integralWrapper.data;
    let sum = 0; let v; let u; const kernel = 3; let A; let B; let C; let D; let avg; const
        size = (kernel * 2 + 1) * (kernel * 2 + 1);

    // clear out top & bottom-border
    for (v = 0; v <= kernel; v++) {
        for (u = 0; u < width; u++) {
            targetData[((v) * width) + u] = 0;
            targetData[(((height - 1) - v) * width) + u] = 0;
        }
    }

    // clear out left & right border
    for (v = kernel; v < height - kernel; v++) {
        for (u = 0; u <= kernel; u++) {
            targetData[((v) * width) + u] = 0;
            targetData[((v) * width) + (width - 1 - u)] = 0;
        }
    }

    for (v = kernel + 1; v < height - kernel - 1; v++) {
        for (u = kernel + 1; u < width - kernel; u++) {
            A = integralImageData[(v - kernel - 1) * width + (u - kernel - 1)];
            B = integralImageData[(v - kernel - 1) * width + (u + kernel)];
            C = integralImageData[(v + kernel) * width + (u - kernel - 1)];
            D = integralImageData[(v + kernel) * width + (u + kernel)];
            sum = D - C - B + A;
            avg = sum / (size);
            targetData[v * width + u] = imageData[v * width + u] > (avg + 5) ? 0 : 1;
        }
    }
}

export function cluster(points, threshold, property) {
    let i; let k; let thisCluster; let point; const
        clusters = [];

    if (!property) {
        // eslint-disable-next-line no-param-reassign
        property = 'rad';
    }

    function addToCluster(newPoint) {
        let found = false;
        for (k = 0; k < clusters.length; k++) {
            thisCluster = clusters[k];
            if (thisCluster.fits(newPoint)) {
                thisCluster.add(newPoint);
                found = true;
            }
        }
        return found;
    }

    // iterate over each cloud
    for (i = 0; i < points.length; i++) {
        point = Cluster2.createPoint(points[i], i, property);
        if (!addToCluster(point)) {
            clusters.push(Cluster2.create(point, threshold));
        }
    }
    return clusters;
}

export const Tracer = {
    trace(points, vec) {
        let iteration;
        const maxIterations = 10;
        let top = [];
        let result = [];
        let centerPos = 0;
        let currentPos = 0;

        function trace(idx, forward) {
            let to;
            let toIdx;
            let predictedPos;
            const thresholdX = 1;
            const thresholdY = Math.abs(vec[1] / 10);
            let found = false;

            function match(pos, predicted) {
                if (pos.x > (predicted.x - thresholdX)
                        && pos.x < (predicted.x + thresholdX)
                        && pos.y > (predicted.y - thresholdY)
                        && pos.y < (predicted.y + thresholdY)) {
                    return true;
                }
                return false;
            }

            // check if the next index is within the vec specifications
            // if not, check as long as the threshold is met

            const from = points[idx];
            if (forward) {
                predictedPos = {
                    x: from.x + vec[0],
                    y: from.y + vec[1],
                };
            } else {
                predictedPos = {
                    x: from.x - vec[0],
                    y: from.y - vec[1],
                };
            }

            toIdx = forward ? idx + 1 : idx - 1;
            to = points[toIdx];
            // eslint-disable-next-line no-cond-assign
            while (to && (found = match(to, predictedPos)) !== true && (Math.abs(to.y - from.y) < vec[1])) {
                toIdx = forward ? toIdx + 1 : toIdx - 1;
                to = points[toIdx];
            }

            return found ? toIdx : null;
        }

        for (iteration = 0; iteration < maxIterations; iteration++) {
            // randomly select point to start with
            centerPos = Math.floor(Math.random() * points.length);

            // trace forward
            top = [];
            currentPos = centerPos;
            top.push(points[currentPos]);
            // eslint-disable-next-line no-cond-assign
            while ((currentPos = trace(currentPos, true)) !== null) {
                top.push(points[currentPos]);
            }
            if (centerPos > 0) {
                currentPos = centerPos;
                // eslint-disable-next-line no-cond-assign
                while ((currentPos = trace(currentPos, false)) !== null) {
                    top.push(points[currentPos]);
                }
            }

            if (top.length > result.length) {
                result = top;
            }
        }
        return result;
    },
};

export const DILATE = 1;
export const ERODE = 2;

export function dilate(inImageWrapper, outImageWrapper) {
    let v;
    let u;
    const inImageData = inImageWrapper.data;
    const outImageData = outImageWrapper.data;
    const height = inImageWrapper.size.y;
    const width = inImageWrapper.size.x;
    let sum;
    let yStart1;
    let yStart2;
    let xStart1;
    let xStart2;

    for (v = 1; v < height - 1; v++) {
        for (u = 1; u < width - 1; u++) {
            yStart1 = v - 1;
            yStart2 = v + 1;
            xStart1 = u - 1;
            xStart2 = u + 1;
            sum = inImageData[yStart1 * width + xStart1] + inImageData[yStart1 * width + xStart2]
            + inImageData[v * width + u]
            + inImageData[yStart2 * width + xStart1] + inImageData[yStart2 * width + xStart2];
            outImageData[v * width + u] = sum > 0 ? 1 : 0;
        }
    }
}

export function erode(inImageWrapper, outImageWrapper) {
    let v;
    let u;
    const inImageData = inImageWrapper.data;
    const outImageData = outImageWrapper.data;
    const height = inImageWrapper.size.y;
    const width = inImageWrapper.size.x;
    let sum;
    let yStart1;
    let yStart2;
    let xStart1;
    let xStart2;

    for (v = 1; v < height - 1; v++) {
        for (u = 1; u < width - 1; u++) {
            yStart1 = v - 1;
            yStart2 = v + 1;
            xStart1 = u - 1;
            xStart2 = u + 1;
            sum = inImageData[yStart1 * width + xStart1] + inImageData[yStart1 * width + xStart2]
            + inImageData[v * width + u]
            + inImageData[yStart2 * width + xStart1] + inImageData[yStart2 * width + xStart2];
            outImageData[v * width + u] = sum === 5 ? 1 : 0;
        }
    }
}

export function subtract(aImageWrapper, bImageWrapper, resultImageWrapper) {
    if (!resultImageWrapper) {
        // eslint-disable-next-line no-param-reassign
        resultImageWrapper = aImageWrapper;
    }
    let { length } = aImageWrapper.data;
    const aImageData = aImageWrapper.data;
    const bImageData = bImageWrapper.data;
    const cImageData = resultImageWrapper.data;

    while (length--) {
        cImageData[length] = aImageData[length] - bImageData[length];
    }
}

export function bitwiseOr(aImageWrapper, bImageWrapper, resultImageWrapper) {
    if (!resultImageWrapper) {
        // eslint-disable-next-line no-param-reassign
        resultImageWrapper = aImageWrapper;
    }
    let { length } = aImageWrapper.data;
    const aImageData = aImageWrapper.data;
    const bImageData = bImageWrapper.data;
    const cImageData = resultImageWrapper.data;

    while (length--) {
        cImageData[length] = aImageData[length] || bImageData[length];
    }
}

export function countNonZero(imageWrapper) {
    let { length } = imageWrapper.data;
    const { data } = imageWrapper;
    let sum = 0;

    while (length--) {
        sum += data[length];
    }
    return sum;
}

export function topGeneric(list, top, scoreFunc) {
    let i; let minIdx = 0; let min = 0; const queue = []; let score; let hit; let
        pos;

    for (i = 0; i < top; i++) {
        queue[i] = {
            score: 0,
            item: null,
        };
    }

    for (i = 0; i < list.length; i++) {
        score = scoreFunc.apply(this, [list[i]]);
        if (score > min) {
            hit = queue[minIdx];
            hit.score = score;
            hit.item = list[i];
            min = Number.MAX_VALUE;
            for (pos = 0; pos < top; pos++) {
                if (queue[pos].score < min) {
                    min = queue[pos].score;
                    minIdx = pos;
                }
            }
        }
    }

    return queue;
}

export function grayArrayFromImage(htmlImage, offsetX, ctx, array) {
    ctx.drawImage(htmlImage, offsetX, 0, htmlImage.width, htmlImage.height);
    const ctxData = ctx.getImageData(offsetX, 0, htmlImage.width, htmlImage.height).data;
    computeGray(ctxData, array);
}

export function grayArrayFromContext(ctx, size, offset, array) {
    const ctxData = ctx.getImageData(offset.x, offset.y, size.x, size.y).data;
    computeGray(ctxData, array);
}

export function grayAndHalfSampleFromCanvasData(canvasData, size, outArray) {
    let topRowIdx = 0;
    let bottomRowIdx = size.x;
    const endIdx = Math.floor(canvasData.length / 4);
    const outWidth = size.x / 2;
    let outImgIdx = 0;
    const inWidth = size.x;
    let i;

    while (bottomRowIdx < endIdx) {
        for (i = 0; i < outWidth; i++) {
            // eslint-disable-next-line no-param-reassign
            outArray[outImgIdx] = (
                (0.299 * canvasData[topRowIdx * 4 + 0]
                 + 0.587 * canvasData[topRowIdx * 4 + 1]
                 + 0.114 * canvasData[topRowIdx * 4 + 2])
                + (0.299 * canvasData[(topRowIdx + 1) * 4 + 0]
                 + 0.587 * canvasData[(topRowIdx + 1) * 4 + 1]
                 + 0.114 * canvasData[(topRowIdx + 1) * 4 + 2])
                + (0.299 * canvasData[(bottomRowIdx) * 4 + 0]
                 + 0.587 * canvasData[(bottomRowIdx) * 4 + 1]
                 + 0.114 * canvasData[(bottomRowIdx) * 4 + 2])
                + (0.299 * canvasData[(bottomRowIdx + 1) * 4 + 0]
                 + 0.587 * canvasData[(bottomRowIdx + 1) * 4 + 1]
                 + 0.114 * canvasData[(bottomRowIdx + 1) * 4 + 2])) / 4;
            outImgIdx++;
            topRowIdx += 2;
            bottomRowIdx += 2;
        }
        topRowIdx += inWidth;
        bottomRowIdx += inWidth;
    }
}

export function computeGray(imageData, outArray, config) {
    const l = (imageData.length / 4) | 0;
    const singleChannel = config && config.singleChannel === true;

    if (singleChannel) {
        for (let i = 0; i < l; i++) {
            // eslint-disable-next-line no-param-reassign
            outArray[i] = imageData[i * 4 + 0];
        }
    } else {
        for (let i = 0; i < l; i++) {
            // eslint-disable-next-line no-param-reassign
            outArray[i] = 0.299 * imageData[i * 4 + 0] + 0.587 * imageData[i * 4 + 1] + 0.114 * imageData[i * 4 + 2];
        }
    }
}

export function loadImageArray(src, callback, canvas = document && document.createElement('canvas')) {
    const img = new Image();
    img.callback = callback;
    img.onload = function () {
        // eslint-disable-next-line no-param-reassign
        canvas.width = this.width;
        // eslint-disable-next-line no-param-reassign
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0);
        const array = new Uint8Array(this.width * this.height);
        ctx.drawImage(this, 0, 0);
        const { data } = ctx.getImageData(0, 0, this.width, this.height);
        computeGray(data, array);
        this.callback(array, {
            x: this.width,
            y: this.height,
        }, this);
    };
    img.src = src;
}

/**
 * @param inImg {ImageWrapper} input image to be sampled
 * @param outImg {ImageWrapper} to be stored in
 */
export function halfSample(inImgWrapper, outImgWrapper) {
    const inImg = inImgWrapper.data;
    const inWidth = inImgWrapper.size.x;
    const outImg = outImgWrapper.data;
    let topRowIdx = 0;
    let bottomRowIdx = inWidth;
    const endIdx = inImg.length;
    const outWidth = inWidth / 2;
    let outImgIdx = 0;
    while (bottomRowIdx < endIdx) {
        for (let i = 0; i < outWidth; i++) {
            outImg[outImgIdx] = Math.floor(
                (inImg[topRowIdx] + inImg[topRowIdx + 1] + inImg[bottomRowIdx] + inImg[bottomRowIdx + 1]) / 4,
            );
            outImgIdx++;
            topRowIdx += 2;
            bottomRowIdx += 2;
        }
        topRowIdx += inWidth;
        bottomRowIdx += inWidth;
    }
}

export function hsv2rgb(hsv, rgb = [0, 0, 0]) {
    const h = hsv[0];
    const s = hsv[1];
    const v = hsv[2];
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
        r = c;
        g = x;
    } else if (h < 120) {
        r = x;
        g = c;
    } else if (h < 180) {
        g = c;
        b = x;
    } else if (h < 240) {
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        b = c;
    } else if (h < 360) {
        r = c;
        b = x;
    }
    // eslint-disable-next-line no-param-reassign
    rgb[0] = ((r + m) * 255) | 0;
    // eslint-disable-next-line no-param-reassign
    rgb[1] = ((g + m) * 255) | 0;
    // eslint-disable-next-line no-param-reassign
    rgb[2] = ((b + m) * 255) | 0;
    return rgb;
}

export function _computeDivisors(n) {
    const largeDivisors = [];
    const divisors = [];

    for (let i = 1; i < Math.sqrt(n) + 1; i++) {
        if (n % i === 0) {
            divisors.push(i);
            if (i !== n / i) {
                largeDivisors.unshift(Math.floor(n / i));
            }
        }
    }
    return divisors.concat(largeDivisors);
}

function _computeIntersection(arr1, arr2) {
    let i = 0;
    let j = 0;
    const result = [];

    while (i < arr1.length && j < arr2.length) {
        if (arr1[i] === arr2[j]) {
            result.push(arr1[i]);
            i++;
            j++;
        } else if (arr1[i] > arr2[j]) {
            j++;
        } else {
            i++;
        }
    }
    return result;
}

export function calculatePatchSize(patchSize, imgSize) {
    const divisorsX = _computeDivisors(imgSize.x);
    const divisorsY = _computeDivisors(imgSize.y);
    const wideSide = Math.max(imgSize.x, imgSize.y);
    const common = _computeIntersection(divisorsX, divisorsY);
    const nrOfPatchesList = [8, 10, 15, 20, 32, 60, 80];
    const nrOfPatchesMap = {
        'x-small': 5,
        small: 4,
        medium: 3,
        large: 2,
        'x-large': 1,
    };
    const nrOfPatchesIdx = nrOfPatchesMap[patchSize] || nrOfPatchesMap.medium;
    const nrOfPatches = nrOfPatchesList[nrOfPatchesIdx];
    const desiredPatchSize = Math.floor(wideSide / nrOfPatches);
    let optimalPatchSize;

    function findPatchSizeForDivisors(divisors) {
        let i = 0;
        let found = divisors[Math.floor(divisors.length / 2)];

        while (i < (divisors.length - 1) && divisors[i] < desiredPatchSize) {
            i++;
        }
        if (i > 0) {
            if (Math.abs(divisors[i] - desiredPatchSize) > Math.abs(divisors[i - 1] - desiredPatchSize)) {
                found = divisors[i - 1];
            } else {
                found = divisors[i];
            }
        }
        if (desiredPatchSize / found < nrOfPatchesList[nrOfPatchesIdx + 1] / nrOfPatchesList[nrOfPatchesIdx]
            && desiredPatchSize / found > nrOfPatchesList[nrOfPatchesIdx - 1] / nrOfPatchesList[nrOfPatchesIdx]) {
            return { x: found, y: found };
        }
        return null;
    }

    optimalPatchSize = findPatchSizeForDivisors(common);
    if (!optimalPatchSize) {
        optimalPatchSize = findPatchSizeForDivisors(_computeDivisors(wideSide));
        if (!optimalPatchSize) {
            optimalPatchSize = findPatchSizeForDivisors((_computeDivisors(desiredPatchSize * nrOfPatches)));
        }
    }
    return optimalPatchSize;
}

export function _parseCSSDimensionValues(value) {
    const dimension = {
        value: parseFloat(value),
        unit: value.indexOf('%') === value.length - 1 ? '%' : '%',
    };

    return dimension;
}

export const _dimensionsConverters = {
    top(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.height * (dimension.value / 100)) : null;
    },
    right(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.width - (context.width * (dimension.value / 100))) : null;
    },
    bottom(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.height - (context.height * (dimension.value / 100))) : null;
    },
    left(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.width * (dimension.value / 100)) : null;
    },
};

export function computeImageArea(inputWidth, inputHeight, area) {
    const context = { width: inputWidth, height: inputHeight };

    const parsedArea = Object.keys(area).reduce((result, key) => {
        const value = area[key];
        const parsed = _parseCSSDimensionValues(value);
        const calculated = _dimensionsConverters[key](parsed, context);

        // eslint-disable-next-line no-param-reassign
        result[key] = calculated;
        return result;
    }, {});

    return {
        sx: parsedArea.left,
        sy: parsedArea.top,
        sw: parsedArea.right - parsedArea.left,
        sh: parsedArea.bottom - parsedArea.top,
    };
}
