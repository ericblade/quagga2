import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import {
    calculateAreaRect,
    isAreaDefined,
    shouldDrawAreaOverlay,
    drawAreaOverlay,
} from '../area_overlay';
import { type XYSize } from '../../../type-definitions/quagga.d';

describe('Area Overlay', () => {
    describe('calculateAreaRect', () => {
        it('should calculate correct rect with default area (0%)', () => {
            const canvasSize: XYSize = { x: 800, y: 600, type: 'XYSize' };
            const area = { top: '0%', right: '0%', bottom: '0%', left: '0%' };

            const result = calculateAreaRect(canvasSize, area);

            expect(result.x).to.equal(0);
            expect(result.y).to.equal(0);
            expect(result.width).to.equal(800);
            expect(result.height).to.equal(600);
        });

        it('should calculate correct rect with 10% padding on all sides', () => {
            const canvasSize: XYSize = { x: 800, y: 600, type: 'XYSize' };
            const area = { top: '10%', right: '10%', bottom: '10%', left: '10%' };

            const result = calculateAreaRect(canvasSize, area);

            expect(result.x).to.equal(80); // 800 * 0.10
            expect(result.y).to.equal(60); // 600 * 0.10
            expect(result.width).to.equal(640); // 800 - 80 - 80
            expect(result.height).to.equal(480); // 600 - 60 - 60
        });

        it('should calculate correct rect with 25% horizontal center strip', () => {
            const canvasSize: XYSize = { x: 640, y: 480, type: 'XYSize' };
            const area = { top: '25%', right: '0%', bottom: '25%', left: '0%' };

            const result = calculateAreaRect(canvasSize, area);

            expect(result.x).to.equal(0);
            expect(result.y).to.equal(120); // 480 * 0.25
            expect(result.width).to.equal(640);
            expect(result.height).to.equal(240); // 480 - 120 - 120
        });

        it('should handle undefined values as 0%', () => {
            const canvasSize: XYSize = { x: 100, y: 100, type: 'XYSize' };
            const area = { top: '20%' }; // only top defined

            const result = calculateAreaRect(canvasSize, area);

            expect(result.x).to.equal(0);
            expect(result.y).to.equal(20);
            expect(result.width).to.equal(100);
            expect(result.height).to.equal(80);
        });
    });

    describe('isAreaDefined', () => {
        it('should return false for undefined area', () => {
            expect(isAreaDefined(undefined)).to.be.false;
        });

        it('should return false for default area (all 0%)', () => {
            const area = { top: '0%', right: '0%', bottom: '0%', left: '0%' };
            expect(isAreaDefined(area)).to.be.false;
        });

        it('should return true if top is non-zero', () => {
            const area = { top: '10%', right: '0%', bottom: '0%', left: '0%' };
            expect(isAreaDefined(area)).to.be.true;
        });

        it('should return true if right is non-zero', () => {
            const area = { top: '0%', right: '10%', bottom: '0%', left: '0%' };
            expect(isAreaDefined(area)).to.be.true;
        });

        it('should return true if bottom is non-zero', () => {
            const area = { top: '0%', right: '0%', bottom: '10%', left: '0%' };
            expect(isAreaDefined(area)).to.be.true;
        });

        it('should return true if left is non-zero', () => {
            const area = { top: '0%', right: '0%', bottom: '0%', left: '10%' };
            expect(isAreaDefined(area)).to.be.true;
        });

        it('should return false for empty area object', () => {
            const area = {};
            expect(isAreaDefined(area)).to.be.false;
        });
    });

    describe('shouldDrawAreaOverlay', () => {
        it('should return false for undefined area', () => {
            expect(shouldDrawAreaOverlay(undefined)).to.be.false;
        });

        it('should return false for empty area object', () => {
            expect(shouldDrawAreaOverlay({})).to.be.false;
        });

        it('should return true if borderColor is defined', () => {
            expect(shouldDrawAreaOverlay({ borderColor: 'red' })).to.be.true;
        });

        it('should return true if borderWidth > 0', () => {
            expect(shouldDrawAreaOverlay({ borderWidth: 2 })).to.be.true;
        });

        it('should return false if borderWidth is 0', () => {
            expect(shouldDrawAreaOverlay({ borderWidth: 0 })).to.be.false;
        });

        it('should return true if backgroundColor is defined', () => {
            expect(shouldDrawAreaOverlay({ backgroundColor: 'rgba(0, 255, 0, 0.1)' })).to.be.true;
        });

        it('should return false if borderColor is empty string', () => {
            expect(shouldDrawAreaOverlay({ borderColor: '' })).to.be.false;
        });

        it('should return false if backgroundColor is empty string', () => {
            expect(shouldDrawAreaOverlay({ backgroundColor: '' })).to.be.false;
        });
    });

    describe('drawAreaOverlay', () => {
        let mockCtx: sinon.SinonStubbedInstance<CanvasRenderingContext2D>;

        beforeEach(() => {
            mockCtx = {
                strokeStyle: '',
                lineWidth: 0,
                fillStyle: '',
                strokeRect: sinon.stub(),
                fillRect: sinon.stub(),
            } as unknown as sinon.SinonStubbedInstance<CanvasRenderingContext2D>;
        });

        it('should draw rectangle with default style', () => {
            const canvasSize: XYSize = { x: 800, y: 600, type: 'XYSize' };
            const area = { top: '10%', right: '10%', bottom: '10%', left: '10%' };

            drawAreaOverlay(mockCtx as unknown as CanvasRenderingContext2D, canvasSize, area);

            expect(mockCtx.strokeStyle).to.equal('rgba(0, 255, 0, 0.5)');
            expect(mockCtx.lineWidth).to.equal(2);
            expect((mockCtx.strokeRect as sinon.SinonStub).calledOnce).to.be.true;
            expect((mockCtx.strokeRect as sinon.SinonStub).firstCall.args).to.deep.equal([80, 60, 640, 480]);
        });

        it('should draw rectangle with custom style', () => {
            const canvasSize: XYSize = { x: 100, y: 100, type: 'XYSize' };
            const area = { top: '0%', right: '0%', bottom: '0%', left: '0%' };

            drawAreaOverlay(mockCtx as unknown as CanvasRenderingContext2D, canvasSize, area, 'red', 5);

            expect(mockCtx.strokeStyle).to.equal('red');
            expect(mockCtx.lineWidth).to.equal(5);
        });

        it('should not draw stroke when borderWidth is 0', () => {
            const canvasSize: XYSize = { x: 100, y: 100, type: 'XYSize' };
            const area = { top: '0%', right: '0%', bottom: '0%', left: '0%' };

            drawAreaOverlay(mockCtx as unknown as CanvasRenderingContext2D, canvasSize, area, 'red', 0);

            expect((mockCtx.strokeRect as sinon.SinonStub).called).to.be.false;
        });

        it('should draw background fill when backgroundColor is provided', () => {
            const canvasSize: XYSize = { x: 100, y: 100, type: 'XYSize' };
            const area = { top: '10%', right: '10%', bottom: '10%', left: '10%' };

            drawAreaOverlay(
                mockCtx as unknown as CanvasRenderingContext2D,
                canvasSize,
                area,
                'red',
                2,
                'rgba(0, 255, 0, 0.1)',
            );

            expect(mockCtx.fillStyle).to.equal('rgba(0, 255, 0, 0.1)');
            expect((mockCtx.fillRect as sinon.SinonStub).calledOnce).to.be.true;
            expect((mockCtx.fillRect as sinon.SinonStub).firstCall.args).to.deep.equal([10, 10, 80, 80]);
        });

        it('should not draw background fill when backgroundColor is not provided', () => {
            const canvasSize: XYSize = { x: 100, y: 100, type: 'XYSize' };
            const area = { top: '0%', right: '0%', bottom: '0%', left: '0%' };

            drawAreaOverlay(mockCtx as unknown as CanvasRenderingContext2D, canvasSize, area, 'red', 2);

            expect((mockCtx.fillRect as sinon.SinonStub).called).to.be.false;
        });
    });

});
