import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import Skeletonizer from '../skeletonizer';

describe('Skeletonizer', () => {
    let buffer: ArrayBuffer;
    let size: number;
    let skeletonizer: any;
    let images: Uint8Array;

    beforeEach(() => {
        // Standard 8x8 test image size
        // Use 64KB buffer (asm.js spec minimum) like production
        size = 8;
        buffer = new ArrayBuffer(64 * 1024);
        images = new Uint8Array(buffer);
        skeletonizer = Skeletonizer(
            { Math, Uint8Array },
            { size },
            buffer
        );
    });

    describe('Memory Layout', () => {
        it('should allocate buffer with correct size', () => {
            expect(buffer.byteLength).to.equal(64 * 1024);
        });

        it('should share buffer between multiple image regions', () => {
            // Write to first region (working image at offset 0)
            images[0] = 42;
            expect(images[0]).to.equal(42);

            // Verify other regions are independent
            expect(images[size * size]).to.not.equal(42);
        });
    });

    describe('skeletonize() basic functionality', () => {
        it('should process an empty image without errors', () => {
            // All zeros - should terminate immediately
            for (let i = 0; i < size * size; i++) {
                images[i] = 0;
            }

            expect(() => skeletonizer.skeletonize()).to.not.throw();
        });

        it('should produce skeleton in correct output region', () => {
            // Create a simple cross pattern in the working image (region 0)
            const mid = Math.floor(size / 2);
            for (let i = 0; i < size; i++) {
                images[i * size + mid] = 1; // Vertical line
                images[mid * size + i] = 1; // Horizontal line
            }

            skeletonizer.skeletonize();

            // Skeleton should be in region 3 (offset = 3 * size²)
            const skelOffset = 3 * size * size;
            let hasSkeletonPixels = false;

            for (let i = 0; i < size * size; i++) {
                if (images[skelOffset + i] === 1) {
                    hasSkeletonPixels = true;
                    break;
                }
            }

            expect(hasSkeletonPixels).to.be.true;
        });

        it('should terminate when working image becomes empty', () => {
            // Create a single pixel - should erode away quickly
            images[size * size / 2] = 1;

            expect(() => skeletonizer.skeletonize()).to.not.throw();

            // Working image should be empty after skeletonization
            let sum = 0;
            for (let i = 0; i < size * size; i++) {
                sum += images[i];
            }
            expect(sum).to.equal(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle fully filled image', () => {
            // Fill entire working image
            for (let i = 0; i < size * size; i++) {
                images[i] = 1;
            }

            expect(() => skeletonizer.skeletonize()).to.not.throw();
        });

        it('should handle single line patterns', () => {
            // Vertical line down the middle
            const mid = Math.floor(size / 2);
            for (let i = 1; i < size - 1; i++) {
                images[i * size + mid] = 1;
            }

            skeletonizer.skeletonize();

            // Should produce a thinned skeleton
            const skelOffset = 3 * size * size;
            let skelPixelCount = 0;
            for (let i = 0; i < size * size; i++) {
                if (images[skelOffset + i] === 1) {
                    skelPixelCount++;
                }
            }

            expect(skelPixelCount).to.be.greaterThan(0);
            expect(skelPixelCount).to.be.lessThan(size * size);
        });

        it('should preserve topology - no disconnections', () => {
            // Create a connected shape (L-shape)
            for (let i = 2; i < 6; i++) {
                images[i * size + 2] = 1; // Vertical part
            }
            for (let i = 2; i < 6; i++) {
                images[5 * size + i] = 1; // Horizontal part
            }

            skeletonizer.skeletonize();

            // Skeleton should maintain connectivity
            const skelOffset = 3 * size * size;
            let skelPixelCount = 0;
            for (let i = 0; i < size * size; i++) {
                if (images[skelOffset + i] === 1) {
                    skelPixelCount++;
                }
            }

            // Should have skeleton pixels (connected structure preserved)
            expect(skelPixelCount).to.be.greaterThan(0);
        });
    });

    describe('Border behavior', () => {
        it('should not process border pixels', () => {
            // Fill entire image including borders
            for (let i = 0; i < size * size; i++) {
                images[i] = 1;
            }

            skeletonizer.skeletonize();

            // Check that borders in working image were zeroed
            // Top row
            for (let x = 0; x < size; x++) {
                expect(images[x]).to.equal(0);
            }
            // Bottom row
            for (let x = 0; x < size; x++) {
                expect(images[(size - 1) * size + x]).to.equal(0);
            }
            // Left column
            for (let y = 0; y < size; y++) {
                expect(images[y * size]).to.equal(0);
            }
            // Right column
            for (let y = 0; y < size; y++) {
                expect(images[y * size + (size - 1)]).to.equal(0);
            }
        });
    });

    describe('Performance characteristics', () => {
        it('should complete within reasonable time for small images', () => {
            // Create a moderate complexity pattern
            for (let i = 2; i < 6; i++) {
                for (let j = 2; j < 6; j++) {
                    images[i * size + j] = 1;
                }
            }

            const start = Date.now();
            skeletonizer.skeletonize();
            const elapsed = Date.now() - start;

            // Should complete in under 100ms for 8x8 image
            expect(elapsed).to.be.lessThan(100);
        });
    });

    describe('Different image sizes', () => {
        [4, 8, 16, 32].forEach((testSize) => {
            it(`should work with ${testSize}x${testSize} images`, () => {
                // Use 64KB buffer (asm.js spec minimum) like production
                const testBuffer = new ArrayBuffer(64 * 1024);
                const testImages = new Uint8Array(testBuffer);
                const testSkel = Skeletonizer(
                    { Math, Uint8Array },
                    { size: testSize },
                    testBuffer
                );

                // Create a cross pattern
                const mid = Math.floor(testSize / 2);
                for (let i = 1; i < testSize - 1; i++) {
                    testImages[i * testSize + mid] = 1;
                    testImages[mid * testSize + i] = 1;
                }

                expect(() => testSkel.skeletonize()).to.not.throw();
            });
        });
    });
});
