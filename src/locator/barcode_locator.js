// TODO: when converting this to TypeScript, also convert topGeneric
import * as mat2 from 'gl-mat2';
import * as vec2 from 'gl-vec2';
import * as ArrayHelper from '../common/ArrayHelper';
import { cluster } from '../common/cv_utils';
import calculatePatchSize from '../common/cvutils/calculatePatchSize';
import computeImageArea from '../common/cvutils/computeImageArea';
import halfSample from '../common/cvutils/halfSample';
import hsv2rgb from '../common/cvutils/hsv2rgb';
import imageRef from '../common/cvutils/imageRef';
import otsuThreshold from '../common/cvutils/otsuThreshold';
import topGeneric from '../common/cvutils/topGeneric';
import ImageDebug from '../common/image_debug';
import ImageWrapper from '../common/image_wrapper';
import Rasterizer from './rasterizer';
import skeletonizer from './skeletonizer';
import Tracer from './tracer';

let _config;
let _currentImageWrapper;
let _skelImageWrapper;
let _subImageWrapper;
let _labelImageWrapper;
let _patchGrid;
let _patchLabelGrid;
let _imageToPatchGrid;
let _binaryImageWrapper;
let _patchSize;
const _canvasContainer = {
    ctx: {
        binary: null,
    },
    dom: {
        binary: null,
    },
};
const _numPatches = { x: 0, y: 0 };
let _inputImageWrapper;
let _skeletonizer;

function initBuffers() {
    if (_config.halfSample) {
        _currentImageWrapper = new ImageWrapper({
            // eslint-disable-next-line no-bitwise
            x: _inputImageWrapper.size.x / 2 | 0,
            // eslint-disable-next-line no-bitwise
            y: _inputImageWrapper.size.y / 2 | 0,
        });
    } else {
        _currentImageWrapper = _inputImageWrapper;
    }

    _patchSize = calculatePatchSize(_config.patchSize, _currentImageWrapper.size);

    // eslint-disable-next-line no-bitwise
    _numPatches.x = _currentImageWrapper.size.x / _patchSize.x | 0;
    // eslint-disable-next-line no-bitwise
    _numPatches.y = _currentImageWrapper.size.y / _patchSize.y | 0;

    _binaryImageWrapper = new ImageWrapper(_currentImageWrapper.size, undefined, Uint8Array, false);

    _labelImageWrapper = new ImageWrapper(_patchSize, undefined, Array, true);

    const skeletonImageData = new ArrayBuffer(64 * 1024);
    _subImageWrapper = new ImageWrapper(_patchSize,
        new Uint8Array(skeletonImageData, 0, _patchSize.x * _patchSize.y));
    _skelImageWrapper = new ImageWrapper(_patchSize,
        new Uint8Array(skeletonImageData, _patchSize.x * _patchSize.y * 3, _patchSize.x * _patchSize.y),
        undefined, true);
    _skeletonizer = skeletonizer(
        (typeof window !== 'undefined') ? window : (typeof self !== 'undefined') ? self : global,
        { size: _patchSize.x },
        skeletonImageData,
    );

    _imageToPatchGrid = new ImageWrapper({
        // eslint-disable-next-line no-bitwise
        x: (_currentImageWrapper.size.x / _subImageWrapper.size.x) | 0,
        // eslint-disable-next-line no-bitwise
        y: (_currentImageWrapper.size.y / _subImageWrapper.size.y) | 0,
    }, undefined, Array, true);
    _patchGrid = new ImageWrapper(_imageToPatchGrid.size, undefined, undefined, true);
    _patchLabelGrid = new ImageWrapper(_imageToPatchGrid.size, undefined, Int32Array, true);
}

function initCanvas() {
    if (_config.useWorker || typeof document === 'undefined') {
        return;
    }
    _canvasContainer.dom.binary = document.createElement('canvas');
    _canvasContainer.dom.binary.className = 'binaryBuffer';
    if (ENV.development && _config.debug.showCanvas === true) {
        document.querySelector('#debug').appendChild(_canvasContainer.dom.binary);
    }
    _canvasContainer.ctx.binary = _canvasContainer.dom.binary.getContext('2d');
    _canvasContainer.dom.binary.width = _binaryImageWrapper.size.x;
    _canvasContainer.dom.binary.height = _binaryImageWrapper.size.y;
}

/**
 * Creates a bounding box which encloses all the given patches
 * @returns {Array} The minimal bounding box
 */
function boxFromPatches(patches) {
    let overAvg;
    let i;
    let j;
    let patch;
    let transMat;
    let box;
    let scale;

    // draw all patches which are to be taken into consideration
    overAvg = 0;
    for (i = 0; i < patches.length; i++) {
        patch = patches[i];
        overAvg += patch.rad;
        if (ENV.development && _config.debug.showPatches) {
            ImageDebug.drawRect(patch.pos, _subImageWrapper.size, _canvasContainer.ctx.binary, { color: 'red' });
        }
    }

    overAvg /= patches.length;
    overAvg = (overAvg * 180 / Math.PI + 90) % 180 - 90;
    if (overAvg < 0) {
        overAvg += 180;
    }

    overAvg = (180 - overAvg) * Math.PI / 180;
    transMat = mat2.copy(mat2.create(), [Math.cos(overAvg), Math.sin(overAvg), -Math.sin(overAvg), Math.cos(overAvg)]);

    // iterate over patches and rotate by angle
    for (i = 0; i < patches.length; i++) {
        patch = patches[i];
        for (j = 0; j < 4; j++) {
            vec2.transformMat2(patch.box[j], patch.box[j], transMat);
        }

        if (ENV.development && _config.debug.boxFromPatches.showTransformed) {
            ImageDebug.drawPath(patch.box, { x: 0, y: 1 }, _canvasContainer.ctx.binary, { color: '#99ff00', lineWidth: 2 });
        }
    }

    // let minx = _binaryImageWrapper.size.x;
    // let miny = _binaryImageWrapper.size.y;
    // let maxx = -_binaryImageWrapper.size.x;
    // let maxy = -_binaryImageWrapper.size.y;
    let minx = Infinity;
    let maxx = -Infinity;
    let miny = Infinity;
    let maxy = -Infinity;
    // find bounding box
    patches.forEach((patch) => {
        for (j = 0; j < 4; j++) {
            minx = Math.min(minx, patch.box[j][0]);
            maxx = Math.max(maxx, patch.box[j][0]);
            miny = Math.min(miny, patch.box[j][1]);
            maxy = Math.max(maxy, patch.box[j][1]);
        }
    });

    box = [[minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy]];

    if (ENV.development && _config.debug.boxFromPatches.showTransformedBox) {
        ImageDebug.drawPath(box, { x: 0, y: 1 }, _canvasContainer.ctx.binary, { color: '#ff0000', lineWidth: 2 });
    }

    scale = _config.halfSample ? 2 : 1;
    // reverse rotation;
    transMat = mat2.invert(transMat, transMat);
    for (j = 0; j < 4; j++) {
        vec2.transformMat2(box[j], box[j], transMat);
    }

    if (ENV.development && _config.debug.boxFromPatches.showBB) {
        ImageDebug.drawPath(box, { x: 0, y: 1 }, _canvasContainer.ctx.binary, { color: '#ff0000', lineWidth: 2 });
    }

    for (j = 0; j < 4; j++) {
        vec2.scale(box[j], box[j], scale);
    }

    return box;
}

/**
 * Creates a binary image of the current image
 */
function binarizeImage() {
    otsuThreshold(_currentImageWrapper, _binaryImageWrapper);
    _binaryImageWrapper.zeroBorder();
    if (ENV.development && _config.debug.showCanvas) {
        _binaryImageWrapper.show(_canvasContainer.dom.binary, 255);
    }
}

/**
 * Iterate over the entire image
 * extract patches
 */
function findPatches() {
    let i;
    let j;
    let x;
    let y;
    let moments;
    let patchesFound = [];
    let rasterizer;
    let rasterResult;
    let patch;
    for (i = 0; i < _numPatches.x; i++) {
        for (j = 0; j < _numPatches.y; j++) {
            x = _subImageWrapper.size.x * i;
            y = _subImageWrapper.size.y * j;

            // seperate parts
            skeletonize(x, y);

            // Rasterize, find individual bars
            _skelImageWrapper.zeroBorder();
            ArrayHelper.init(_labelImageWrapper.data, 0);
            rasterizer = Rasterizer.create(_skelImageWrapper, _labelImageWrapper);
            rasterResult = rasterizer.rasterize(0);

            if (ENV.development && _config.debug.showLabels) {
                _labelImageWrapper.overlay(_canvasContainer.dom.binary, Math.floor(360 / rasterResult.count),
                    { x, y });
            }

            // calculate moments from the skeletonized patch
            moments = _labelImageWrapper.moments(rasterResult.count);

            // extract eligible patches
            patchesFound = patchesFound.concat(describePatch(moments, [i, j], x, y));
        }
    }

    if (ENV.development && _config.debug.showFoundPatches) {
        for (i = 0; i < patchesFound.length; i++) {
            patch = patchesFound[i];
            ImageDebug.drawRect(patch.pos, _subImageWrapper.size, _canvasContainer.ctx.binary,
                { color: '#99ff00', lineWidth: 2 });
        }
    }

    return patchesFound;
}

/**
 * Finds those connected areas which contain at least 6 patches
 * and returns them ordered DESC by the number of contained patches
 * @param {Number} maxLabel
 */
function findBiggestConnectedAreas(maxLabel) {
    let i;
    let sum;
    let labelHist = [];
    let topLabels = [];

    for (i = 0; i < maxLabel; i++) {
        labelHist.push(0);
    }
    sum = _patchLabelGrid.data.length;
    while (sum--) {
        if (_patchLabelGrid.data[sum] > 0) {
            labelHist[_patchLabelGrid.data[sum] - 1]++;
        }
    }

    labelHist = labelHist.map((val, idx) => ({
        val,
        label: idx + 1,
    }));

    labelHist.sort((a, b) => b.val - a.val);

    // extract top areas with at least 6 patches present
    topLabels = labelHist.filter((el) => el.val >= 5);

    return topLabels;
}

/**
 *
 */
function findBoxes(topLabels, maxLabel) {
    let i;
    let j;
    let sum;
    const patches = [];
    let patch;
    let box;
    const boxes = [];
    const hsv = [0, 1, 1];
    const rgb = [0, 0, 0];

    for (i = 0; i < topLabels.length; i++) {
        sum = _patchLabelGrid.data.length;
        patches.length = 0;
        while (sum--) {
            if (_patchLabelGrid.data[sum] === topLabels[i].label) {
                patch = _imageToPatchGrid.data[sum];
                patches.push(patch);
            }
        }
        box = boxFromPatches(patches);
        if (box) {
            boxes.push(box);

            // draw patch-labels if requested
            if (ENV.development && _config.debug.showRemainingPatchLabels) {
                for (j = 0; j < patches.length; j++) {
                    patch = patches[j];
                    hsv[0] = (topLabels[i].label / (maxLabel + 1)) * 360;
                    hsv2rgb(hsv, rgb);
                    ImageDebug.drawRect(patch.pos, _subImageWrapper.size, _canvasContainer.ctx.binary,
                        { color: `rgb(${rgb.join(',')})`, lineWidth: 2 });
                }
            }
        }
    }
    return boxes;
}

/**
 * Find similar moments (via cluster)
 * @param {Object} moments
 */
function similarMoments(moments) {
    const clusters = cluster(moments, 0.90);
    const topCluster = topGeneric(clusters, 1, (e) => e.getPoints().length);
    let points = []; const
        result = [];
    if (topCluster.length === 1) {
        points = topCluster[0].item.getPoints();
        for (let i = 0; i < points.length; i++) {
            result.push(points[i].point);
        }
    }
    return result;
}

function skeletonize(x, y) {
    _binaryImageWrapper.subImageAsCopy(_subImageWrapper, imageRef(x, y));
    _skeletonizer.skeletonize();

    // Show skeleton if requested
    if (ENV.development && _config.debug.showSkeleton) {
        _skelImageWrapper.overlay(_canvasContainer.dom.binary, 360, imageRef(x, y));
    }
}

/**
 * Extracts and describes those patches which seem to contain a barcode pattern
 * @param {Array} moments
 * @param {Object} patchPos,
 * @param {Number} x
 * @param {Number} y
 * @returns {Array} list of patches
 */
function describePatch(moments, patchPos, x, y) {
    let k;
    let avg;
    const eligibleMoments = [];
    let matchingMoments;
    let patch;
    const patchesFound = [];
    const minComponentWeight = Math.ceil(_patchSize.x / 3);

    if (moments.length >= 2) {
        // only collect moments which's area covers at least minComponentWeight pixels.
        for (k = 0; k < moments.length; k++) {
            if (moments[k].m00 > minComponentWeight) {
                eligibleMoments.push(moments[k]);
            }
        }

        // if at least 2 moments are found which have at least minComponentWeights covered
        if (eligibleMoments.length >= 2) {
            matchingMoments = similarMoments(eligibleMoments);
            avg = 0;
            // determine the similarity of the moments
            for (k = 0; k < matchingMoments.length; k++) {
                avg += matchingMoments[k].rad;
            }

            // Only two of the moments are allowed not to fit into the equation
            // add the patch to the set
            if (matchingMoments.length > 1
                    && matchingMoments.length >= (eligibleMoments.length / 4) * 3
                    && matchingMoments.length > moments.length / 4) {
                avg /= matchingMoments.length;
                patch = {
                    index: patchPos[1] * _numPatches.x + patchPos[0],
                    pos: {
                        x,
                        y,
                    },
                    box: [
                        vec2.clone([x, y]),
                        vec2.clone([x + _subImageWrapper.size.x, y]),
                        vec2.clone([x + _subImageWrapper.size.x, y + _subImageWrapper.size.y]),
                        vec2.clone([x, y + _subImageWrapper.size.y]),
                    ],
                    moments: matchingMoments,
                    rad: avg,
                    vec: vec2.clone([Math.cos(avg), Math.sin(avg)]),
                };
                patchesFound.push(patch);
            }
        }
    }
    return patchesFound;
}

/**
 * finds patches which are connected and share the same orientation
 * @param {Object} patchesFound
 */
function rasterizeAngularSimilarity(patchesFound) {
    let label = 0;
    const threshold = 0.95;
    let currIdx = 0;
    let j;
    let patch;
    const hsv = [0, 1, 1];
    const rgb = [0, 0, 0];

    function notYetProcessed() {
        let i;
        for (i = 0; i < _patchLabelGrid.data.length; i++) {
            if (_patchLabelGrid.data[i] === 0 && _patchGrid.data[i] === 1) {
                return i;
            }
        }
        return _patchLabelGrid.length;
    }

    function trace(currentIdx) {
        let x;
        let y;
        let currentPatch;
        let idx;
        let dir;
        const current = {
            x: currentIdx % _patchLabelGrid.size.x,
            y: (currentIdx / _patchLabelGrid.size.x) | 0,
        };
        let similarity;

        if (currentIdx < _patchLabelGrid.data.length) {
            currentPatch = _imageToPatchGrid.data[currentIdx];
            // assign label
            _patchLabelGrid.data[currentIdx] = label;
            for (dir = 0; dir < Tracer.searchDirections.length; dir++) {
                y = current.y + Tracer.searchDirections[dir][0];
                x = current.x + Tracer.searchDirections[dir][1];
                idx = y * _patchLabelGrid.size.x + x;

                // continue if patch empty
                if (_patchGrid.data[idx] === 0) {
                    _patchLabelGrid.data[idx] = Number.MAX_VALUE;
                    // eslint-disable-next-line no-continue
                    continue;
                }

                if (_patchLabelGrid.data[idx] === 0) {
                    similarity = Math.abs(vec2.dot(_imageToPatchGrid.data[idx].vec, currentPatch.vec));
                    if (similarity > threshold) {
                        trace(idx);
                    }
                }
            }
        }
    }

    // prepare for finding the right patches
    ArrayHelper.init(_patchGrid.data, 0);
    ArrayHelper.init(_patchLabelGrid.data, 0);
    ArrayHelper.init(_imageToPatchGrid.data, null);

    for (j = 0; j < patchesFound.length; j++) {
        patch = patchesFound[j];
        _imageToPatchGrid.data[patch.index] = patch;
        _patchGrid.data[patch.index] = 1;
    }

    // rasterize the patches found to determine area
    _patchGrid.zeroBorder();

    // eslint-disable-next-line no-cond-assign
    while ((currIdx = notYetProcessed()) < _patchLabelGrid.data.length) {
        label++;
        trace(currIdx);
    }

    // draw patch-labels if requested
    if (ENV.development && _config.debug.showPatchLabels) {
        for (j = 0; j < _patchLabelGrid.data.length; j++) {
            if (_patchLabelGrid.data[j] > 0 && _patchLabelGrid.data[j] <= label) {
                patch = _imageToPatchGrid.data[j];
                hsv[0] = (_patchLabelGrid.data[j] / (label + 1)) * 360;
                hsv2rgb(hsv, rgb);
                ImageDebug.drawRect(patch.pos, _subImageWrapper.size, _canvasContainer.ctx.binary,
                    { color: `rgb(${rgb.join(',')})`, lineWidth: 2 });
            }
        }
    }

    return label;
}

export default {
    init(inputImageWrapper, config) {
        _config = config;
        _inputImageWrapper = inputImageWrapper;

        initBuffers();
        initCanvas();
    },

    locate() {
        if (_config.halfSample) {
            halfSample(_inputImageWrapper, _currentImageWrapper);
        }

        binarizeImage();
        const patchesFound = findPatches();
        // return unless 5% or more patches are found
        if (patchesFound.length < _numPatches.x * _numPatches.y * 0.05) {
            return null;
        }

        // rasterrize area by comparing angular similarity;
        const maxLabel = rasterizeAngularSimilarity(patchesFound);
        if (maxLabel < 1) {
            return null;
        }

        // search for area with the most patches (biggest connected area)
        const topLabels = findBiggestConnectedAreas(maxLabel);
        if (topLabels.length === 0) {
            return null;
        }

        const boxes = findBoxes(topLabels, maxLabel);
        return boxes;
    },

    checkImageConstraints(inputStream, config) {
        let patchSize;
        let width = inputStream.getWidth();
        let height = inputStream.getHeight();
        const thisHalfSample = config.halfSample ? 0.5 : 1;
        let area;

        // calculate width and height based on area
        if (inputStream.getConfig().area) {
            area = computeImageArea(width, height, inputStream.getConfig().area);
            inputStream.setTopRight({ x: area.sx, y: area.sy });
            inputStream.setCanvasSize({ x: width, y: height });
            width = area.sw;
            height = area.sh;
        }

        const size = {
            x: Math.floor(width * thisHalfSample),
            y: Math.floor(height * thisHalfSample),
        };

        patchSize = calculatePatchSize(config.patchSize, size);
        if (ENV.development) {
            console.log(`Patch-Size: ${JSON.stringify(patchSize)}`);
        }

        inputStream.setWidth(Math.floor(Math.floor(size.x / patchSize.x) * (1 / thisHalfSample) * patchSize.x));
        inputStream.setHeight(Math.floor(Math.floor(size.y / patchSize.y) * (1 / thisHalfSample) * patchSize.y));

        if ((inputStream.getWidth() % patchSize.x) === 0 && (inputStream.getHeight() % patchSize.y) === 0) {
            return true;
        }

        throw new Error(`Image dimensions do not comply with the current settings: Width (${
            width} )and height (${height
        }) must a multiple of ${patchSize.x}`);
    },
};
