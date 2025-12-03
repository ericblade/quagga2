import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { QuaggaContext } from '../../../QuaggaContext';
import initCanvas from '../../initCanvas';

// These tests verify initCanvas behavior in a browser environment where document is defined.
// In the browser, dom.image and ctx.image should always be HTMLCanvasElement and CanvasRenderingContext2D
// respectively, while overlay depends on the createOverlay config option.

describe('initCanvas (browser)', () => {
    let context: QuaggaContext;
    let createdCanvases: HTMLCanvasElement[] = [];

    beforeEach(() => {
        context = new QuaggaContext();
        // Mock the input stream
        context.inputStream = {
            getCanvasSize: () => ({ type: 'XYSize' as const, x: 640, y: 480 }),
        };

        // Clean up any existing canvases from previous tests
        document.querySelectorAll('canvas.imgBuffer, canvas.drawingBuffer').forEach((canvas) => {
            canvas.remove();
        });
    });

    afterEach(() => {
        // Clean up canvases created during tests
        createdCanvases.forEach((canvas) => {
            if (canvas.parentElement) {
                canvas.parentElement.removeChild(canvas);
            }
        });
        createdCanvases = [];

        // Also clean up any canvases that may have been created
        document.querySelectorAll('canvas.imgBuffer, canvas.drawingBuffer').forEach((canvas) => {
            canvas.remove();
        });
    });

    describe('canvas structure', () => {
        it('should return object with dom and ctx properties each having image and overlay', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            // Verify dom object has both image and overlay properties
            expect(result!.dom).to.be.an('object');
            expect(result!.dom).to.have.property('image');
            expect(result!.dom).to.have.property('overlay');
            // Verify ctx object has both image and overlay properties
            expect(result!.ctx).to.be.an('object');
            expect(result!.ctx).to.have.property('image');
            expect(result!.ctx).to.have.property('overlay');
        });
    });

    describe('dom.image and ctx.image (always present in browser)', () => {
        it('should always have dom.image as HTMLCanvasElement in browser', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            expect(result!.dom.image).to.be.instanceOf(HTMLCanvasElement);
            expect(result!.dom.image!.className).to.equal('imgBuffer');
        });

        it('should always have ctx.image as CanvasRenderingContext2D in browser', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            expect(result!.ctx.image).to.be.instanceOf(CanvasRenderingContext2D);
        });

        it('should set canvas dimensions from inputStream.getCanvasSize()', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
            };

            const result = initCanvas(context);

            expect(result!.dom.image!.width).to.equal(640);
            expect(result!.dom.image!.height).to.equal(480);
        });
    });

    describe('overlay with createOverlay: true (default)', () => {
        it('should have dom.overlay as HTMLCanvasElement when createOverlay is true', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: true,
                },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            expect(result!.dom.overlay).to.be.instanceOf(HTMLCanvasElement);
            expect(result!.dom.overlay!.className).to.equal('drawingBuffer');
        });

        it('should have ctx.overlay as CanvasRenderingContext2D when createOverlay is true', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: true,
                },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            expect(result!.ctx.overlay).to.be.instanceOf(CanvasRenderingContext2D);
        });

        it('should create overlay by default when createOverlay is not specified', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                // No canvas config - should default to createOverlay: true
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            expect(result!.dom.overlay).to.be.instanceOf(HTMLCanvasElement);
            expect(result!.ctx.overlay).to.be.instanceOf(CanvasRenderingContext2D);
        });

        it('should set overlay canvas dimensions from inputStream.getCanvasSize()', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: true,
                },
            };

            const result = initCanvas(context);

            expect(result!.dom.overlay!.width).to.equal(640);
            expect(result!.dom.overlay!.height).to.equal(480);
        });
    });

    describe('overlay with createOverlay: false', () => {
        it('should have null dom.overlay when createOverlay is false', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: false,
                },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            // Image should still be present
            expect(result!.dom.image).to.be.instanceOf(HTMLCanvasElement);
            // But overlay should be null
            expect(result!.dom.overlay).to.be.null;
        });

        it('should have null ctx.overlay when createOverlay is false', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: false,
                },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
            // Image context should still be present
            expect(result!.ctx.image).to.be.instanceOf(CanvasRenderingContext2D);
            // But overlay context should be null
            expect(result!.ctx.overlay).to.be.null;
        });
    });

    describe('edge cases', () => {
        it('should return null when inputStream type is not defined', () => {
            context.config = {
                inputStream: {},
            };

            const result = initCanvas(context);

            expect(result).to.be.null;
        });

        it('should reuse existing canvas elements if they exist in the DOM', () => {
            // Create existing canvas elements
            const existingImageCanvas = document.createElement('canvas');
            existingImageCanvas.className = 'imgBuffer';
            document.body.appendChild(existingImageCanvas);
            createdCanvases.push(existingImageCanvas);

            const existingOverlayCanvas = document.createElement('canvas');
            existingOverlayCanvas.className = 'drawingBuffer';
            document.body.appendChild(existingOverlayCanvas);
            createdCanvases.push(existingOverlayCanvas);

            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: true,
                },
            };

            const result = initCanvas(context);

            // Should reuse existing canvases
            expect(result!.dom.image).to.equal(existingImageCanvas);
            expect(result!.dom.overlay).to.equal(existingOverlayCanvas);
        });
    });
});
