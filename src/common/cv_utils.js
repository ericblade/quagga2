/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
// import { clone as v2clone } from 'gl-vec2';
// import { clone as v3clone } from 'gl-vec3';
import Cluster2 from './cluster';
import { bitwiseOr, bitwiseAnd, bitwiseXor, bitwiseNot } from './cvutils/bitwise';
import calculatePatchSize from './cvutils/calculatePatchSize';
import computeBinaryImage from './cvutils/computeBinaryImage';
import computeGray from './cvutils/computeGray';
import computeHistogram from './cvutils/computeHistogram';
import computeImageArea from './cvutils/computeImageArea';
import computeIntegralImage from './cvutils/computeIntegralImage';
import computeIntegralImage2 from './cvutils/computeIntegralImage2';
import countNonZero from './cvutils/countNonZero';
import determineOtsuThreshold from './cvutils/determineOtsuThreshold';
import dilate from './cvutils/dilate';
import erode from './cvutils/erode';
import grayAndHalfSampleFromCanvasData from './cvutils/grayAndHalfSampleFromCanvasData';
import grayArrayFromContext from './cvutils/grayArrayFromContext';
import grayArrayFromImage from './cvutils/grayArrayFromImage';
import halfSample from './cvutils/halfSample';
import hsv2rgb from './cvutils/hsv2rgb';
import ImageRef from './cvutils/ImageRef';
import loadImageArray from './cvutils/loadImageArray';
import otsuThreshold from './cvutils/otsuThreshold';
import sharpenLine from './cvutils/sharpenLine';
import subtract from './cvutils/subtract';
import thresholdImage from './cvutils/thresholdImage';
import topGeneric from './cvutils/topGeneric';

// export const vec2 = { clone: v2clone };
// export const vec3 = { clone: v3clone };

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

export {
    bitwiseOr,
    bitwiseXor,
    bitwiseNot,
    bitwiseAnd,
    calculatePatchSize,
    computeBinaryImage,
    computeGray,
    computeHistogram,
    computeImageArea,
    computeIntegralImage,
    computeIntegralImage2,
    countNonZero,
    determineOtsuThreshold,
    dilate,
    erode,
    grayAndHalfSampleFromCanvasData,
    grayArrayFromContext,
    grayArrayFromImage,
    halfSample,
    hsv2rgb,
    ImageRef,
    loadImageArray,
    otsuThreshold,
    sharpenLine,
    subtract,
    thresholdImage,
    topGeneric,
};
