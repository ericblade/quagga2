import { describe, it } from 'mocha';
import { expect } from 'chai';
import Ndarray from 'ndarray';
import Interp2D from 'ndarray-linear-interpolate';

/**
 * Browser's bilinear interpolation function (matches ndarray-linear-interpolate behavior)
 * This is a direct copy of the function in frame_grabber_browser.js for testing
 */
function bilinearInterpolate(grayData: Uint8Array, width: number, height: number, x: number, y: number): number {
    const ix = Math.floor(x);
    const fx = x - ix;
    const s0 = ix >= 0 && ix < width;
    const s1 = (ix + 1) >= 0 && (ix + 1) < width;

    const iy = Math.floor(y);
    const fy = y - iy;
    const t0 = iy >= 0 && iy < height;
    const t1 = (iy + 1) >= 0 && (iy + 1) < height;

    // Return 0 for out-of-bounds pixels (same as ndarray-linear-interpolate)
    const w00 = (s0 && t0) ? grayData[iy * width + ix] : 0.0;
    const w01 = (s0 && t1) ? grayData[(iy + 1) * width + ix] : 0.0;
    const w10 = (s1 && t0) ? grayData[iy * width + (ix + 1)] : 0.0;
    const w11 = (s1 && t1) ? grayData[(iy + 1) * width + (ix + 1)] : 0.0;

    return (1.0 - fy) * ((1.0 - fx) * w00 + fx * w10) + fy * ((1.0 - fx) * w01 + fx * w11);
}

describe('Bilinear Interpolation Consistency', () => {
    const width = 4;
    const height = 3;
    let grayData: Uint8Array;
    let ndarrayImage: ReturnType<typeof Ndarray>;

    beforeEach(() => {
        // Create test image: value = row * 50 + col * 10 + 50
        grayData = new Uint8Array(width * height);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                grayData[row * width + col] = row * 50 + col * 10 + 50;
            }
        }
        // Node uses ndarray with transpose to access (x, y) as column-major
        ndarrayImage = (Ndarray(grayData, [height, width]) as any).transpose(1, 0);
    });

    describe('interior points', () => {
        it('should match at origin (0, 0)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0, 0);
            const browserVal = bilinearInterpolate(grayData, width, height, 0, 0);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at integer coordinates (1, 0)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 1, 0);
            const browserVal = bilinearInterpolate(grayData, width, height, 1, 0);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at fractional x coordinate (0.5, 0)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0.5, 0);
            const browserVal = bilinearInterpolate(grayData, width, height, 0.5, 0);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at fractional y coordinate (0, 0.5)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0, 0.5);
            const browserVal = bilinearInterpolate(grayData, width, height, 0, 0.5);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at fractional x,y coordinate (0.5, 0.5)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0.5, 0.5);
            const browserVal = bilinearInterpolate(grayData, width, height, 0.5, 0.5);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at interior fractional coordinate (1.5, 1.5)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 1.5, 1.5);
            const browserVal = bilinearInterpolate(grayData, width, height, 1.5, 1.5);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });
    });

    describe('boundary points (critical for consistent barcode scanning)', () => {
        it('should match at right edge (3, 0)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 3, 0);
            const browserVal = bilinearInterpolate(grayData, width, height, 3, 0);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match beyond right edge (3.5, 0) - returns 0 for out-of-bounds', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 3.5, 0);
            const browserVal = bilinearInterpolate(grayData, width, height, 3.5, 0);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at bottom edge (0, 2)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0, 2);
            const browserVal = bilinearInterpolate(grayData, width, height, 0, 2);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match beyond bottom edge (0, 2.5) - returns 0 for out-of-bounds', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0, 2.5);
            const browserVal = bilinearInterpolate(grayData, width, height, 0, 2.5);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at corner (3, 2)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 3, 2);
            const browserVal = bilinearInterpolate(grayData, width, height, 3, 2);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match beyond corner (3.5, 2.5) - returns 0 for out-of-bounds', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 3.5, 2.5);
            const browserVal = bilinearInterpolate(grayData, width, height, 3.5, 2.5);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });
    });

    describe('negative coordinates (out-of-bounds)', () => {
        it('should match at negative x (-0.5, 0)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, -0.5, 0);
            const browserVal = bilinearInterpolate(grayData, width, height, -0.5, 0);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });

        it('should match at negative y (0, -0.5)', () => {
            const nodeVal = Interp2D.d2(ndarrayImage, 0, -0.5);
            const browserVal = bilinearInterpolate(grayData, width, height, 0, -0.5);
            expect(browserVal).to.be.closeTo(nodeVal, 0.001);
        });
    });
});
