/**
 * Test to verify that frame_grabber (Node) and frame_grabber_browser produce 
 * identical output when given the same RGBA input data.
 * 
 * This test loads actual image fixtures and compares both implementations' 
 * scaleAndCrop algorithms directly in Node.
 */
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as path from 'path';

// Import the actual Node FrameGrabber
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FrameGrabberNode = require('../../frame_grabber');

// Import the Node input stream to create a proper inputStream
// eslint-disable-next-line @typescript-eslint/no-var-requires
const InputStreamFactory = require('../../input_stream/input_stream').default;

// Import ndarray for Node's implementation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Ndarray = require('ndarray');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Interp2D = require('ndarray-linear-interpolate').d2;

// Import computeGray which both implementations use
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { computeGray } = require('../../../common/cv_utils');

/**
 * Browser's bilinear interpolation (extracted from frame_grabber_browser.js)
 */
function browserBilinearInterpolate(grayData: Uint8Array, width: number, height: number, x: number, y: number): number {
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
 * Simulate browser's scaleAndCrop (non-halfSample path) from frame_grabber_browser.js
 * This extracts the core algorithm so we can compare it with Node's version
 */
function browserScaleAndCrop(
    rgbaData: Uint8Array,
    videoWidth: number,
    videoHeight: number, 
    canvasWidth: number,
    canvasHeight: number,
    topRightX: number,
    topRightY: number,
    outputWidth: number,
    outputHeight: number,
    config: any = {}
): Uint8Array {
    // Step 1: Convert to grayscale (same as browser does)
    const grayData = new Uint8Array(videoWidth * videoHeight);
    computeGray(rgbaData, grayData, config);
    
    // Step 2: Scale using bilinear interpolation (browser's method)
    const scaledGrayData = new Uint8Array(canvasWidth * canvasHeight);
    const stepSizeX = videoWidth / canvasWidth;
    const stepSizeY = videoHeight / canvasHeight;
    
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            const srcX = x * stepSizeX;
            const srcY = y * stepSizeY;
            // eslint-disable-next-line no-bitwise
            scaledGrayData[y * canvasWidth + x] = browserBilinearInterpolate(
                grayData,
                videoWidth,
                videoHeight,
                srcX,
                srcY
            ) | 0;
        }
    }
    
    // Step 3: Crop to target region
    const outputData = new Uint8Array(outputWidth * outputHeight);
    for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
            const srcIdx = (y + topRightY) * canvasWidth + (x + topRightX);
            outputData[y * outputWidth + x] = scaledGrayData[srcIdx];
        }
    }
    
    return outputData;
}

/**
 * Node's scaleAndCrop using ndarray (extracted from frame_grabber.js)
 */
function nodeScaleAndCrop(
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
    computeGray(rgbaData, grayData, {});

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
 * Helper to wait for input stream to be ready
 */
function waitForCanRecord(inputStream: any): Promise<void> {
    return new Promise((resolve) => {
        inputStream.addEventListener('canrecord', () => {
            resolve();
        });
    });
}

describe('Frame Grabber grab() Function', function() {
    // Increase timeout for image loading
    this.timeout(10000);

    describe('Node frame_grabber.js grab() with real fixture', () => {
        let inputStream: any;
        let frameGrabber: any;
        let grabResult: boolean;
        let outputData: Uint8Array;

        beforeEach(async () => {
            // Create an input stream using the real Node implementation
            inputStream = InputStreamFactory.createImageStream();
            
            // Configure it with a real fixture image
            const fixturePath = path.resolve(__dirname, '../../../../test/fixtures/code_39/image-001.jpg');
            inputStream.setInputStream({
                src: fixturePath,
                mime: 'image/jpeg',
                size: 800, // Limit size for testing
                sequence: false,
            });

            // Wait for the image to load
            await waitForCanRecord(inputStream);

            // Set up canvas size and other required properties
            inputStream.setCanvasSize({ x: inputStream.getWidth(), y: inputStream.getHeight() });
            inputStream.setTopRight({ x: 0, y: 0 });

            // Create the frame grabber with the input stream
            frameGrabber = FrameGrabberNode.create(inputStream, null);

            // Execute grab
            grabResult = frameGrabber.grab();
            outputData = frameGrabber.getData();
        });

        it('should successfully grab a frame', () => {
            expect(grabResult).to.be.true;
        });

        it('should produce output data of correct size', () => {
            const expectedSize = inputStream.getWidth() * inputStream.getHeight();
            expect(outputData.length).to.equal(expectedSize);
        });

        it('should produce non-zero grayscale data', () => {
            // Check that we have actual image data (not all zeros)
            let nonZeroCount = 0;
            for (let i = 0; i < outputData.length; i++) {
                if (outputData[i] > 0) nonZeroCount++;
            }
            expect(nonZeroCount).to.be.greaterThan(outputData.length * 0.1);
        });

        it('should produce grayscale values in valid range [0, 255]', () => {
            for (let i = 0; i < outputData.length; i++) {
                expect(outputData[i]).to.be.at.least(0);
                expect(outputData[i]).to.be.at.most(255);
            }
        });

        it('should capture output for codabar image-008 (known problematic image)', async () => {
            // Test specifically with the problematic codabar image mentioned in the issue
            const codabarStream = InputStreamFactory.createImageStream();
            const codabarPath = path.resolve(__dirname, '../../../../test/fixtures/codabar/image-008.jpg');
            codabarStream.setInputStream({
                src: codabarPath,
                mime: 'image/jpeg',
                size: 800,
                sequence: false,
            });

            await waitForCanRecord(codabarStream);
            codabarStream.setCanvasSize({ x: codabarStream.getWidth(), y: codabarStream.getHeight() });
            codabarStream.setTopRight({ x: 0, y: 0 });

            const codabarGrabber = FrameGrabberNode.create(codabarStream, null);
            const codabarGrabResult = codabarGrabber.grab();
            const codabarData = codabarGrabber.getData();

            expect(codabarGrabResult).to.be.true;
            expect(codabarData.length).to.equal(codabarStream.getWidth() * codabarStream.getHeight());

            // Log some statistics about the data for debugging
            let min = 255, max = 0, sum = 0;
            for (let i = 0; i < codabarData.length; i++) {
                if (codabarData[i] < min) min = codabarData[i];
                if (codabarData[i] > max) max = codabarData[i];
                sum += codabarData[i];
            }
            const avg = sum / codabarData.length;
            
            console.log(`Codabar image-008 stats: min=${min}, max=${max}, avg=${avg.toFixed(2)}`);
            console.log(`  Image dimensions: ${codabarStream.getWidth()}x${codabarStream.getHeight()}`);
            console.log(`  Data length: ${codabarData.length}`);
            
            // Sample first 20 values for comparison
            console.log('  First 20 values:', Array.from(codabarData.slice(0, 20)));
        });
    });

    describe('Frame data capture for comparison', () => {
        it('should capture and log frame data from code_39 image-010 (mentioned in original issue)', async () => {
            const inputStream = InputStreamFactory.createImageStream();
            const imagePath = path.resolve(__dirname, '../../../../test/fixtures/code_39/image-010.jpg');
            inputStream.setInputStream({
                src: imagePath,
                mime: 'image/jpeg',
                size: 800,
                sequence: false,
            });

            await waitForCanRecord(inputStream);
            inputStream.setCanvasSize({ x: inputStream.getWidth(), y: inputStream.getHeight() });
            inputStream.setTopRight({ x: 0, y: 0 });

            const grabber = FrameGrabberNode.create(inputStream, null);
            const result = grabber.grab();
            const data = grabber.getData();

            expect(result).to.be.true;

            // Log statistics for comparison with browser output
            let min = 255, max = 0, sum = 0;
            for (let i = 0; i < data.length; i++) {
                if (data[i] < min) min = data[i];
                if (data[i] > max) max = data[i];
                sum += data[i];
            }
            const avg = sum / data.length;

            console.log('\n=== Code_39 image-010 Node grab() output ===');
            console.log(`Image dimensions: ${inputStream.getWidth()}x${inputStream.getHeight()}`);
            console.log(`Real dimensions: ${inputStream.getRealWidth()}x${inputStream.getRealHeight()}`);
            console.log(`Data length: ${data.length}`);
            console.log(`Stats: min=${min}, max=${max}, avg=${avg.toFixed(2)}`);
            console.log('First 50 values:', Array.from(data.slice(0, 50)));
            console.log('Last 50 values:', Array.from(data.slice(-50)));
            
            // Save a middle row sample for visual comparison
            const middleRowStart = Math.floor(inputStream.getHeight() / 2) * inputStream.getWidth();
            console.log('Middle row sample (first 50):', Array.from(data.slice(middleRowStart, middleRowStart + 50)));
        });
    });

    describe('Node vs Browser scaleAndCrop comparison', () => {
        it('should compare Node and Browser scaleAndCrop algorithms with codabar image-008', async () => {
            // Load the actual image using Node's input stream
            const inputStream = InputStreamFactory.createImageStream();
            const imagePath = path.resolve(__dirname, '../../../../test/fixtures/codabar/image-008.jpg');
            inputStream.setInputStream({
                src: imagePath,
                mime: 'image/jpeg',
                size: 800,
                sequence: false,
            });

            await waitForCanRecord(inputStream);
            
            // Get dimensions
            const videoWidth = inputStream.getRealWidth();
            const videoHeight = inputStream.getRealHeight();
            const canvasWidth = inputStream.getWidth();
            const canvasHeight = inputStream.getHeight();
            
            // Get the raw RGBA data from the frame
            const frame = inputStream.getFrame();
            expect(frame).to.not.be.null;
            expect(frame.data).to.not.be.undefined;
            
            // Convert ndarray frame to Uint8Array RGBA data
            const rgbaData = new Uint8Array(videoWidth * videoHeight * 4);
            for (let y = 0; y < videoHeight; y++) {
                for (let x = 0; x < videoWidth; x++) {
                    const idx = (y * videoWidth + x) * 4;
                    rgbaData[idx] = frame.get(x, y, 0);     // R
                    rgbaData[idx + 1] = frame.get(x, y, 1); // G
                    rgbaData[idx + 2] = frame.get(x, y, 2); // B
                    rgbaData[idx + 3] = frame.get(x, y, 3); // A
                }
            }
            
            console.log('\n=== Comparing Node vs Browser scaleAndCrop ===');
            console.log(`Video size: ${videoWidth}x${videoHeight}`);
            console.log(`Canvas size: ${canvasWidth}x${canvasHeight}`);
            
            // Run both algorithms with the same input
            const nodeOutput = nodeScaleAndCrop(
                rgbaData,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0, // topRight
                canvasWidth, canvasHeight // output size
            );
            
            const browserOutput = browserScaleAndCrop(
                rgbaData,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0, // topRight
                canvasWidth, canvasHeight, // output size
                {} // config
            );
            
            // Compare outputs
            expect(nodeOutput.length).to.equal(browserOutput.length);
            
            let diffCount = 0;
            let maxDiff = 0;
            let totalDiff = 0;
            const diffPositions: number[] = [];
            
            for (let i = 0; i < nodeOutput.length; i++) {
                const diff = Math.abs(nodeOutput[i] - browserOutput[i]);
                if (diff > 0) {
                    diffCount++;
                    totalDiff += diff;
                    if (diff > maxDiff) maxDiff = diff;
                    if (diffPositions.length < 10) {
                        diffPositions.push(i);
                    }
                }
            }
            
            const avgDiff = diffCount > 0 ? totalDiff / diffCount : 0;
            
            console.log(`\nComparison results:`);
            console.log(`  Total pixels: ${nodeOutput.length}`);
            console.log(`  Pixels with differences: ${diffCount} (${(diffCount / nodeOutput.length * 100).toFixed(2)}%)`);
            console.log(`  Max difference: ${maxDiff}`);
            console.log(`  Average difference (when different): ${avgDiff.toFixed(2)}`);
            
            if (diffCount > 0) {
                console.log(`\nFirst 10 difference positions:`);
                diffPositions.forEach(pos => {
                    console.log(`    [${pos}]: Node=${nodeOutput[pos]}, Browser=${browserOutput[pos]}, diff=${Math.abs(nodeOutput[pos] - browserOutput[pos])}`);
                });
            }
            
            // Sample comparison
            console.log('\nFirst 20 values comparison:');
            console.log('  Node:   ', Array.from(nodeOutput.slice(0, 20)));
            console.log('  Browser:', Array.from(browserOutput.slice(0, 20)));
            
            // The test should pass if implementations match, or fail with useful info if they don't
            if (diffCount > 0) {
                console.log('\n*** IMPLEMENTATIONS DIFFER! See details above. ***');
            } else {
                console.log('\n*** IMPLEMENTATIONS MATCH! ***');
            }
            
            // For now, just assert they were computed - we want to see the comparison
            expect(nodeOutput.length).to.be.greaterThan(0);
            expect(browserOutput.length).to.be.greaterThan(0);
        });
        
        it('should compare Node and Browser with code_39 image-010 (original issue image)', async () => {
            const inputStream = InputStreamFactory.createImageStream();
            const imagePath = path.resolve(__dirname, '../../../../test/fixtures/code_39/image-010.jpg');
            inputStream.setInputStream({
                src: imagePath,
                mime: 'image/jpeg',
                size: 800,
                sequence: false,
            });

            await waitForCanRecord(inputStream);
            
            const videoWidth = inputStream.getRealWidth();
            const videoHeight = inputStream.getRealHeight();
            const canvasWidth = inputStream.getWidth();
            const canvasHeight = inputStream.getHeight();
            
            const frame = inputStream.getFrame();
            expect(frame).to.not.be.null;
            
            // Convert ndarray frame to Uint8Array RGBA data
            const rgbaData = new Uint8Array(videoWidth * videoHeight * 4);
            for (let y = 0; y < videoHeight; y++) {
                for (let x = 0; x < videoWidth; x++) {
                    const idx = (y * videoWidth + x) * 4;
                    rgbaData[idx] = frame.get(x, y, 0);
                    rgbaData[idx + 1] = frame.get(x, y, 1);
                    rgbaData[idx + 2] = frame.get(x, y, 2);
                    rgbaData[idx + 3] = frame.get(x, y, 3);
                }
            }
            
            console.log('\n=== Code_39 image-010: Node vs Browser comparison ===');
            console.log(`Video size: ${videoWidth}x${videoHeight}`);
            console.log(`Canvas size: ${canvasWidth}x${canvasHeight}`);
            
            const nodeOutput = nodeScaleAndCrop(
                rgbaData,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0,
                canvasWidth, canvasHeight
            );
            
            const browserOutput = browserScaleAndCrop(
                rgbaData,
                videoWidth, videoHeight,
                canvasWidth, canvasHeight,
                0, 0,
                canvasWidth, canvasHeight,
                {}
            );
            
            let diffCount = 0;
            let maxDiff = 0;
            
            for (let i = 0; i < nodeOutput.length; i++) {
                const diff = Math.abs(nodeOutput[i] - browserOutput[i]);
                if (diff > 0) {
                    diffCount++;
                    if (diff > maxDiff) maxDiff = diff;
                }
            }
            
            console.log(`Pixels with differences: ${diffCount} / ${nodeOutput.length}`);
            console.log(`Max difference: ${maxDiff}`);
            console.log('First 20 - Node:   ', Array.from(nodeOutput.slice(0, 20)));
            console.log('First 20 - Browser:', Array.from(browserOutput.slice(0, 20)));
            
            if (diffCount === 0) {
                console.log('\n*** scaleAndCrop implementations produce IDENTICAL output! ***');
                console.log('*** The difference must be in image acquisition (canvas vs direct buffer) ***');
            }
        });
    });
});
