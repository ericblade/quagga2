/**
 * Test to verify that frame_grabber (Node) grab() function output can be captured and compared.
 * This test loads actual image fixtures and exercises the real grab() function.
 * 
 * Note: In the browser, webpack replaces frame_grabber with frame_grabber_browser,
 * so this test file will run different implementations depending on the environment.
 */
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as path from 'path';

// Import the actual FrameGrabber - in Node this is frame_grabber.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FrameGrabber = require('../../frame_grabber');

// Import the Node input stream to create a proper inputStream
// eslint-disable-next-line @typescript-eslint/no-var-requires
const InputStreamFactory = require('../../input_stream/input_stream').default;

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
            frameGrabber = FrameGrabber.create(inputStream, null);

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

            const codabarGrabber = FrameGrabber.create(codabarStream, null);
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

            const grabber = FrameGrabber.create(inputStream, null);
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
});
