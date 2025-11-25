/**
 * Browser test for frame_grabber grab() function.
 * This test loads actual image fixtures and captures the grab() output,
 * writing it to a file that can be compared with Node's output.
 */
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

// Import the browser FrameGrabber (this will be frame_grabber_browser.js in browser builds)
import FrameGrabber from '../../frame_grabber_browser';

// Import the browser input stream
import InputStreamFactory from '../../input_stream/input_stream_browser';

/**
 * Helper to load an image and wait for it to be ready
 */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Create a mock input stream that returns the loaded image
 */
function createMockInputStream(img: HTMLImageElement, config: any = {}) {
    const width = config.size || img.width;
    const height = config.size ? Math.floor(img.height * (config.size / img.width)) : img.height;
    
    return {
        getRealWidth: () => img.width,
        getRealHeight: () => img.height,
        getWidth: () => width,
        getHeight: () => height,
        getCanvasSize: () => ({ x: width, y: height }),
        getTopRight: () => ({ x: 0, y: 0 }),
        getConfig: () => ({ 
            type: 'ImageStream',
            halfSample: false,
            willReadFrequently: true,
            ...config 
        }),
        getFrame: () => ({ img, tags: {} }),
    };
}

describe('Browser Frame Grabber grab() Function', function() {
    this.timeout(10000);

    describe('grab() with codabar image-008', () => {
        let grabData: Uint8Array;
        let imageWidth: number;
        let imageHeight: number;

        before(async () => {
            // Load the fixture image
            const img = await loadImage('/test/fixtures/codabar/image-008.jpg');
            
            // Create mock input stream
            const inputStream = createMockInputStream(img, { size: 800 });
            imageWidth = inputStream.getWidth();
            imageHeight = inputStream.getHeight();
            
            // Create frame grabber and call grab
            const frameGrabber = FrameGrabber.create(inputStream, null);
            const result = frameGrabber.grab();
            
            expect(result).to.be.true;
            grabData = frameGrabber.getData();
        });

        it('should produce output data of correct size', () => {
            expect(grabData.length).to.equal(imageWidth * imageHeight);
        });

        it('should produce non-zero grayscale data', () => {
            let nonZeroCount = 0;
            for (let i = 0; i < grabData.length; i++) {
                if (grabData[i] > 0) nonZeroCount++;
            }
            expect(nonZeroCount).to.be.greaterThan(grabData.length * 0.1);
        });

        it('should log grab data for comparison with Node', () => {
            // Calculate statistics
            let min = 255, max = 0, sum = 0;
            for (let i = 0; i < grabData.length; i++) {
                if (grabData[i] < min) min = grabData[i];
                if (grabData[i] > max) max = grabData[i];
                sum += grabData[i];
            }
            const avg = sum / grabData.length;

            console.log('\n=== Browser codabar image-008 grab() output ===');
            console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);
            console.log(`Data length: ${grabData.length}`);
            console.log(`Stats: min=${min}, max=${max}, avg=${avg.toFixed(2)}`);
            console.log('First 20 values:', Array.from(grabData.slice(0, 20)));
            console.log('Last 20 values:', Array.from(grabData.slice(-20)));
            
            // Write data to file for Node comparison
            const outputData = {
                image: 'codabar/image-008.jpg',
                width: imageWidth,
                height: imageHeight,
                stats: { min, max, avg },
                first50: Array.from(grabData.slice(0, 50)),
                last50: Array.from(grabData.slice(-50)),
                // Store full data as base64 to keep file size manageable
                fullDataBase64: btoa(String.fromCharCode.apply(null, Array.from(grabData))),
            };
            
            // Use Cypress to write the file
            if (typeof cy !== 'undefined') {
                cy.writeFile('tmp/browser_grab_codabar_008.json', JSON.stringify(outputData, null, 2));
            }
        });
    });

    describe('grab() with code_39 image-010', () => {
        let grabData: Uint8Array;
        let imageWidth: number;
        let imageHeight: number;

        before(async () => {
            const img = await loadImage('/test/fixtures/code_39/image-010.jpg');
            const inputStream = createMockInputStream(img, { size: 800 });
            imageWidth = inputStream.getWidth();
            imageHeight = inputStream.getHeight();
            
            const frameGrabber = FrameGrabber.create(inputStream, null);
            const result = frameGrabber.grab();
            
            expect(result).to.be.true;
            grabData = frameGrabber.getData();
        });

        it('should produce output data of correct size', () => {
            expect(grabData.length).to.equal(imageWidth * imageHeight);
        });

        it('should log grab data for comparison with Node', () => {
            let min = 255, max = 0, sum = 0;
            for (let i = 0; i < grabData.length; i++) {
                if (grabData[i] < min) min = grabData[i];
                if (grabData[i] > max) max = grabData[i];
                sum += grabData[i];
            }
            const avg = sum / grabData.length;

            console.log('\n=== Browser code_39 image-010 grab() output ===');
            console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);
            console.log(`Data length: ${grabData.length}`);
            console.log(`Stats: min=${min}, max=${max}, avg=${avg.toFixed(2)}`);
            console.log('First 20 values:', Array.from(grabData.slice(0, 20)));
            
            const outputData = {
                image: 'code_39/image-010.jpg',
                width: imageWidth,
                height: imageHeight,
                stats: { min, max, avg },
                first50: Array.from(grabData.slice(0, 50)),
                last50: Array.from(grabData.slice(-50)),
                fullDataBase64: btoa(String.fromCharCode.apply(null, Array.from(grabData))),
            };
            
            if (typeof cy !== 'undefined') {
                cy.writeFile('tmp/browser_grab_code39_010.json', JSON.stringify(outputData, null, 2));
            }
        });
    });
});
