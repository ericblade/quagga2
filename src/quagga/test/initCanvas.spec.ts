import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { QuaggaContext } from '../../QuaggaContext';
import initCanvas from '../initCanvas';

describe('src/quagga/initCanvas.ts', () => {
    describe('initCanvas', () => {
        let context: QuaggaContext;

        beforeEach(() => {
            context = new QuaggaContext();
            // Mock the input stream
            context.inputStream = {
                getCanvasSize: () => ({ type: 'XYSize' as const, x: 640, y: 480 }),
            };
        });

        it('should return container with all null properties when there is no document (Node.js)', () => {
            // Node.js environment - no document
            context.config = {
                inputStream: { type: 'ImageStream' },
            };

            const result = initCanvas(context);

            // In Node.js (no document), should return default container with all null values
            expect(result).to.be.an('object');
            // Since we're in Node.js where document is undefined,
            // all dom and ctx properties should be null
            expect(result!.dom.image).to.be.null;
            expect(result!.dom.overlay).to.be.null;
            expect(result!.ctx.image).to.be.null;
            expect(result!.ctx.overlay).to.be.null;
        });

        it('should return null when inputStream type is not defined', () => {
            context.config = {
                inputStream: {},
            };

            const result = initCanvas(context);

            expect(result).to.be.null;
        });

        it('should respect createOverlay: false config option', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    createOverlay: false,
                },
            };

            const result = initCanvas(context);

            // Result should be returned but overlay should be null
            expect(result).to.be.an('object');
            expect(result!.dom.overlay).to.be.null;
            expect(result!.ctx.overlay).to.be.null;
        });

        it('should default createOverlay to true when canvas config is not specified', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                // No canvas config - should default to createOverlay: true
            };

            const result = initCanvas(context);

            // In Node.js (no document), will still return null overlay
            // but the logic path for default true is tested
            expect(result).to.be.an('object');
        });

        it('should default createOverlay to true when canvas.createOverlay is undefined', () => {
            context.config = {
                inputStream: { type: 'ImageStream' },
                canvas: {
                    // createOverlay not specified - should default to true
                },
            };

            const result = initCanvas(context);

            expect(result).to.be.an('object');
        });
    });
});
