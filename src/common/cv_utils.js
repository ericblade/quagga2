/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
// import { clone as v2clone } from 'gl-vec2';
// import { clone as v3clone } from 'gl-vec3';
import Cluster2 from './cluster';

export {
    bitwiseOr, bitwiseAnd, bitwiseXor, bitwiseNot,
} from './cvutils/bitwise';
export { default as calculatePatchSize } from './cvutils/calculatePatchSize';
export { default as computeBinaryImage } from './cvutils/computeBinaryImage';
export { default as computeGray } from './cvutils/computeGray';
export { default as computeHistogram } from './cvutils/computeHistogram';
export { default as computeImageArea } from './cvutils/computeImageArea';
export { default as computeIntegralImage } from './cvutils/computeIntegralImage';
export { default as computeIntegralImage2 } from './cvutils/computeIntegralImage2';
export { default as countNonZero } from './cvutils/countNonZero';
export { default as determineOtsuThreshold } from './cvutils/determineOtsuThreshold';
export { default as dilate } from './cvutils/dilate';
export { default as erode } from './cvutils/erode';
export { default as grayAndHalfSampleFromCanvasData } from './cvutils/grayAndHalfSampleFromCanvasData';
export { default as grayArrayFromContext } from './cvutils/grayArrayFromContext';
export { default as grayArrayFromImage } from './cvutils/grayArrayFromImage';
export { default as halfSample } from './cvutils/halfSample';
export { default as hsv2rgb } from './cvutils/hsv2rgb';
export { default as ImageRef } from './cvutils/ImageRef';
export { default as loadImageArray } from './cvutils/loadImageArray';
export { default as otsuThreshold } from './cvutils/otsuThreshold';
export { default as sharpenLine } from './cvutils/sharpenLine';
export { default as subtract } from './cvutils/subtract';
export { default as thresholdImage } from './cvutils/thresholdImage';
export { default as topGeneric } from './cvutils/topGeneric';

// TODO: there is a separate module for Cluster -- are one of them removeable?
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

// TODO: there is a separate module for Tracer. Are one of them removeable?
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
