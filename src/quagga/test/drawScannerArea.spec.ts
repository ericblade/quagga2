/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import Quagga from '../quagga';

type MockCtx = {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    fillRectCalls: number;
    strokeRectCalls: number;
    lastFillArgs?: [number, number, number, number];
    lastStrokeArgs?: [number, number, number, number];
    fillRect: (x: number, y: number, w: number, h: number) => void;
    strokeRect: (x: number, y: number, w: number, h: number) => void;
};

function createMockCtx(): MockCtx {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        fillRectCalls: 0,
        strokeRectCalls: 0,
        fillRect(x: number, y: number, w: number, h: number) {
            this.lastFillArgs = [x, y, w, h];
            this.fillRectCalls += 1;
        },
        strokeRect(x: number, y: number, w: number, h: number) {
            this.lastStrokeArgs = [x, y, w, h];
            this.strokeRectCalls += 1;
        },
    };
}

describe('Quagga.drawScannerArea', () => {
    let quagga: Quagga;
    let mockCtx: MockCtx;

    beforeEach(() => {
        quagga = new Quagga();
        mockCtx = createMockCtx();
        // @ts-ignore - assigning mock ctx
        quagga.context.canvasContainer.ctx.overlay = mockCtx as any;
        // Mock inputStream with getTopRight
        quagga.context.inputStream = {
            getTopRight: () => ({ x: 0, y: 0 }),
        } as any;
        // Default config with area
        quagga.context.config = {
            locate: false,
            inputStream: {
                type: 'LiveStream',
                area: {
                    top: '10%',
                    right: '10%',
                    bottom: '10%',
                    left: '10%',
                    backgroundColor: 'rgba(255,0,0,0.2)',
                },
            },
        } as any;
        // Mock boxSize (200x100 canvas with 10% insets: 180x80 box)
        quagga.context.boxSize = [
            [18, 10],    // top-left
            [18, 90],    // bottom-left
            [198, 90],   // bottom-right
            [198, 10],   // top-right
        ];
    });

    it('skips drawing when locate is true', () => {
        (quagga.context.config as any).locate = true;
        quagga.drawScannerArea();
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });

    it('skips drawing when no area is configured', () => {
        (quagga.context.config as any).inputStream.area = undefined;
        quagga.drawScannerArea();
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });

    it('skips drawing when no style is provided', () => {
        (quagga.context.config as any).inputStream.area = { top: '10%', left: '10%' };
        quagga.drawScannerArea();
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });

    it('draws fill and stroke based on boxSize', () => {
        (quagga.context.config as any).inputStream.area = {
            backgroundColor: 'rgba(255,0,0,0.2)',
            borderColor: '#00ff00',
            borderWidth: 3,
        };

        quagga.drawScannerArea();

        // boxSize is 180x80 starting at (18,10)
        expect(mockCtx.lastFillArgs).to.deep.equal([18, 10, 180, 80]);
        expect(mockCtx.lastStrokeArgs).to.deep.equal([18, 10, 180, 80]);
        expect(mockCtx.fillStyle).to.equal('rgba(255,0,0,0.2)');
        expect(mockCtx.strokeStyle).to.equal('#00ff00');
        expect(mockCtx.lineWidth).to.equal(3);
    });

    it('defaults border width when only color is provided', () => {
        (quagga.context.config as any).inputStream.area = { borderColor: '#0f0' };
        quagga.drawScannerArea();
        expect(mockCtx.strokeRectCalls).to.equal(1);
        expect(mockCtx.lineWidth).to.equal(2); // default width
        expect(mockCtx.strokeStyle).to.equal('#0f0');
    });

    it('applies topRight offset to position', () => {
        // Area starts at offset (50, 30) on canvas
        quagga.context.inputStream = {
            getTopRight: () => ({ x: 50, y: 30 }),
        } as any;
        // boxSize is relative to the constrained area
        quagga.context.boxSize = [
            [0, 0],      // top-left
            [0, 80],     // bottom-left
            [180, 80],   // bottom-right
            [180, 0],    // top-right
        ];

        quagga.drawScannerArea();

        // Should add offset: (0+50, 0+30) = (50, 30)
        expect(mockCtx.lastFillArgs).to.deep.equal([50, 30, 180, 80]);
    });

    it('is invoked via publishResult when locate=false and area present', () => {
        quagga.publishResult();
        expect(mockCtx.fillRectCalls).to.be.greaterThan(0);
    });

    it('skips drawing when boxSize is not set', () => {
        quagga.context.boxSize = undefined;
        quagga.drawScannerArea();
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });
});
