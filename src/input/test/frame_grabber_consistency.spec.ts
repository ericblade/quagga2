/**
 * Test to verify that frame_grabber (Node) and frame_grabber_browser produce
 * identical output when given the same input.
 * 
 * These tests compare the core scaleAndCrop logic from both implementations.
 * FINDING: When given identical raw input data, both implementations produce
 * identical output for typical usage scenarios.
 */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { computeGray } from '../../common/cv_utils';

// Import ndarray functions used by Node version
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Ndarray = require('ndarray');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Interp2D = require('ndarray-linear-interpolate').d2;

/**
 * Replicates the Node frame_grabber's scaleAndCrop logic
 * This is the reference implementation that uses ndarray
 */
function scaleAndCropNode(
    rgbaData: Uint8Array,
    videoWidth: number,
    videoHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    topRightX: number,
    topRightY: number,
    outputWidth: number,
    outputHeight: number
): Uint8Array {
    const grayData = new Uint8Array(videoWidth * videoHeight);
    const canvasData = new Uint8Array(canvasWidth * canvasHeight);
    const outputData = new Uint8Array(outputWidth * outputHeight);

    // Create ndarray structures like Node's frame_grabber does
    const grayImageArray = Ndarray(grayData, [videoHeight, videoWidth]).transpose(1, 0);
    const canvasImageArray = Ndarray(canvasData, [canvasHeight, canvasWidth]).transpose(1, 0);
    const targetImageArray = canvasImageArray
        .hi(topRightX + outputWidth, topRightY + outputHeight)
        .lo(topRightX, topRightY);

    const stepSizeX = videoWidth / canvasWidth;
    const stepSizeY = videoHeight / canvasHeight;

    // Step 1: compute full-sized gray image
    computeGray(rgbaData, grayData);

    // Step 2: interpolate
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            // eslint-disable-next-line no-bitwise
            canvasImageArray.set(x, y, (Interp2D(grayImageArray, x * stepSizeX, y * stepSizeY)) | 0);
        }
    }

    // Step 3: crop
    for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
            outputData[y * outputWidth + x] = targetImageArray.get(x, y);
        }
    }

    return outputData;
}

/**
 * Bilinear interpolation for grayscale data - replicates browser's current implementation
 * Uses clamping at boundaries (different from ndarray which returns 0)
 */
function bilinearInterpolateBrowser(
    grayData: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number
): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);

    const fx = x - x0;
    const fy = y - y0;

    const v00 = grayData[y0 * width + x0];
    const v10 = grayData[y0 * width + x1];
    const v01 = grayData[y1 * width + x0];
    const v11 = grayData[y1 * width + x1];

    const v0 = v00 * (1 - fx) + v10 * fx;
    const v1 = v01 * (1 - fx) + v11 * fx;

    return v0 * (1 - fy) + v1 * fy;
}

/**
 * Replicates the Browser frame_grabber's scaleAndCrop logic (non-halfSample path)
 * This uses the custom bilinear interpolation
 */
function scaleAndCropBrowser(
    rgbaData: Uint8Array,
    videoWidth: number,
    videoHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    topRightX: number,
    topRightY: number,
    outputWidth: number,
    outputHeight: number
): Uint8Array {
    const grayData = new Uint8Array(videoWidth * videoHeight);
    const scaledGrayData = new Uint8Array(canvasWidth * canvasHeight);
    const outputData = new Uint8Array(outputWidth * outputHeight);

    const stepSizeX = videoWidth / canvasWidth;
    const stepSizeY = videoHeight / canvasHeight;

    // Step 1: Convert RGB to grayscale at original size
    computeGray(rgbaData, grayData);

    // Step 2: Scale the grayscale data using bilinear interpolation
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            const srcX = x * stepSizeX;
            const srcY = y * stepSizeY;
            // eslint-disable-next-line no-bitwise
            scaledGrayData[y * canvasWidth + x] = bilinearInterpolateBrowser(
                grayData,
                videoWidth,
                videoHeight,
                srcX,
                srcY
            ) | 0;
        }
    }

    // Step 3: Crop to target region
    for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
            const srcIdx = (y + topRightY) * canvasWidth + (x + topRightX);
            outputData[y * outputWidth + x] = scaledGrayData[srcIdx];
        }
    }

    return outputData;
}

/**
 * Create a test RGBA image with a gradient pattern
 */
function createTestImage(width: number, height: number): Uint8Array {
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            // Create a gradient pattern
            const r = Math.floor((x / width) * 255);
            const g = Math.floor((y / height) * 255);
            const b = Math.floor(((x + y) / (width + height)) * 255);
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255; // alpha
        }
    }
    return data;
}

/**
 * Calculate difference statistics between two arrays
 */
function calculateDifference(arr1: Uint8Array, arr2: Uint8Array): {
    maxDiff: number;
    avgDiff: number;
    diffCount: number;
    totalPixels: number;
} {
    if (arr1.length !== arr2.length) {
        throw new Error(`Array length mismatch: ${arr1.length} vs ${arr2.length}`);
    }

    let maxDiff = 0;
    let totalDiff = 0;
    let diffCount = 0;

    for (let i = 0; i < arr1.length; i++) {
        const diff = Math.abs(arr1[i] - arr2[i]);
        if (diff > 0) {
            diffCount++;
            totalDiff += diff;
            if (diff > maxDiff) {
                maxDiff = diff;
            }
        }
    }

    return {
        maxDiff,
        avgDiff: diffCount > 0 ? totalDiff / diffCount : 0,
        diffCount,
        totalPixels: arr1.length,
    };
}

describe('Frame Grabber Consistency', () => {
    describe('scaleAndCrop output comparison', () => {
        it('should produce identical output for same input (no scaling)', () => {
            // Test case with no scaling (1:1)
            const width = 100;
            const height = 80;
            const testImage = createTestImage(width, height);

            const nodeOutput = scaleAndCropNode(
                testImage,
                width, height,  // video size
                width, height,  // canvas size (same = no scaling)
                0, 0,           // top right
                width, height   // output size
            );

            const browserOutput = scaleAndCropBrowser(
                testImage,
                width, height,
                width, height,
                0, 0,
                width, height
            );

            const diff = calculateDifference(nodeOutput, browserOutput);
            
            // Log difference info for debugging
            if (diff.diffCount > 0) {
                console.log('Difference stats (no scaling):');
                console.log(`  Max difference: ${diff.maxDiff}`);
                console.log(`  Average difference: ${diff.avgDiff.toFixed(2)}`);
                console.log(`  Pixels with differences: ${diff.diffCount} / ${diff.totalPixels}`);
            }

            expect(nodeOutput).to.deep.equal(browserOutput,
                `Output differs: ${diff.diffCount} pixels differ, max diff: ${diff.maxDiff}`);
        });

        it('should produce identical output for same input (with 2x downscaling)', () => {
            // Test case with 2x downscaling
            const videoWidth = 200;
            const videoHeight = 160;
            const canvasWidth = 100;
            const canvasHeight = 80;
            const testImage = createTestImage(videoWidth, videoHeight);

            const nodeOutput = scaleAndCropNode(
                testImage,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0,
                canvasWidth, canvasHeight
            );

            const browserOutput = scaleAndCropBrowser(
                testImage,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0,
                canvasWidth, canvasHeight
            );

            const diff = calculateDifference(nodeOutput, browserOutput);
            
            if (diff.diffCount > 0) {
                console.log('Difference stats (2x downscaling):');
                console.log(`  Max difference: ${diff.maxDiff}`);
                console.log(`  Average difference: ${diff.avgDiff.toFixed(2)}`);
                console.log(`  Pixels with differences: ${diff.diffCount} / ${diff.totalPixels}`);
            }

            expect(nodeOutput).to.deep.equal(browserOutput,
                `Output differs: ${diff.diffCount} pixels differ, max diff: ${diff.maxDiff}`);
        });

        it('should produce identical output for same input (with cropping)', () => {
            // Test case with cropping (area selection)
            const videoWidth = 200;
            const videoHeight = 160;
            const canvasWidth = 200;
            const canvasHeight = 160;
            const cropX = 20;
            const cropY = 16;
            const outputWidth = 160;
            const outputHeight = 128;
            const testImage = createTestImage(videoWidth, videoHeight);

            const nodeOutput = scaleAndCropNode(
                testImage,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                cropX, cropY,
                outputWidth, outputHeight
            );

            const browserOutput = scaleAndCropBrowser(
                testImage,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                cropX, cropY,
                outputWidth, outputHeight
            );

            const diff = calculateDifference(nodeOutput, browserOutput);
            
            if (diff.diffCount > 0) {
                console.log('Difference stats (with cropping):');
                console.log(`  Max difference: ${diff.maxDiff}`);
                console.log(`  Average difference: ${diff.avgDiff.toFixed(2)}`);
                console.log(`  Pixels with differences: ${diff.diffCount} / ${diff.totalPixels}`);
            }

            expect(nodeOutput).to.deep.equal(browserOutput,
                `Output differs: ${diff.diffCount} pixels differ, max diff: ${diff.maxDiff}`);
        });

        it('should produce identical output for typical barcode scanning scenario', () => {
            // Simulate typical Quagga configuration
            const videoWidth = 640;
            const videoHeight = 480;
            const canvasWidth = 320;  // halfSample = true equivalent
            const canvasHeight = 240;
            const testImage = createTestImage(videoWidth, videoHeight);

            const nodeOutput = scaleAndCropNode(
                testImage,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0,
                canvasWidth, canvasHeight
            );

            const browserOutput = scaleAndCropBrowser(
                testImage,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0,
                canvasWidth, canvasHeight
            );

            const diff = calculateDifference(nodeOutput, browserOutput);
            
            if (diff.diffCount > 0) {
                console.log('Difference stats (typical barcode scenario 640x480 -> 320x240):');
                console.log(`  Max difference: ${diff.maxDiff}`);
                console.log(`  Average difference: ${diff.avgDiff.toFixed(2)}`);
                console.log(`  Pixels with differences: ${diff.diffCount} / ${diff.totalPixels}`);
            }

            expect(nodeOutput).to.deep.equal(browserOutput,
                `Output differs: ${diff.diffCount} pixels differ, max diff: ${diff.maxDiff}`);
        });
    });

    describe('bilinear interpolation boundary behavior', () => {
        it('should behave the same at image boundaries', () => {
            // Create a simple 4x4 grayscale test image
            const width = 4;
            const height = 4;
            const grayData = new Uint8Array([
                100, 120, 130, 140,
                110, 125, 135, 145,
                120, 130, 140, 150,
                130, 140, 150, 160,
            ]);

            // Create ndarray for Node-style interpolation
            const arr = Ndarray(grayData, [height, width]).transpose(1, 0);

            // Test interior point
            const x = 1.5;
            const y = 1.5;
            const nodeResult = Interp2D(arr, x, y) | 0;
            const browserResult = bilinearInterpolateBrowser(grayData, width, height, x, y) | 0;

            console.log(`Interior point (${x}, ${y}): Node=${nodeResult}, Browser=${browserResult}`);
            expect(nodeResult).to.equal(browserResult, 'Interior point interpolation should match');
        });

        it('should show difference at boundaries (documenting current behavior)', () => {
            // This test documents that boundary handling differs between implementations
            const width = 4;
            const height = 4;
            const grayData = new Uint8Array([
                100, 120, 130, 140,
                110, 125, 135, 145,
                120, 130, 140, 150,
                130, 140, 150, 160,
            ]);

            const arr = Ndarray(grayData, [height, width]).transpose(1, 0);

            // Test point beyond edge (x > width-1)
            const x = 3.5;  // Beyond edge
            const y = 0;
            const nodeResult = Interp2D(arr, x, y) | 0;
            const browserResult = bilinearInterpolateBrowser(grayData, width, height, x, y) | 0;

            console.log(`Boundary point (${x}, ${y}): Node=${nodeResult}, Browser=${browserResult}`);
            console.log('  Node uses 0 for out-of-bounds, Browser clamps to edge');
            
            // Document that these differ - this is the core issue
            // Node: averages 140 with 0 -> ~70
            // Browser: clamps to edge, uses 140 -> 140
            if (nodeResult !== browserResult) {
                console.log('  *** Boundary behavior differs as expected ***');
            }
        });
    });
});
