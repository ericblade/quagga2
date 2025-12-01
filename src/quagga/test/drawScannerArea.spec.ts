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
    let size: { x: number; y: number };

    beforeEach(() => {
        quagga = new Quagga();
        mockCtx = createMockCtx();
        // @ts-ignore - assigning mock ctx
        quagga.context.canvasContainer.ctx.overlay = mockCtx as any;
        // Default canvas size and inputStream stub
        size = { x: 200, y: 100 };
        quagga.context.inputStream = {
            getCanvasSize: () => ({ x: size.x, y: size.y }),
        } as any;
        // Default config
        quagga.context.config = {
            locate: false,
            inputStream: { type: 'LiveStream' },
        } as any;
    });

    it('skips drawing when locate is true', () => {
        (quagga.context.config as any).locate = true;
        quagga.drawScannerArea({ top: '10%', left: '10%', backgroundColor: 'rgba(255,0,0,0.2)' });
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });

    it('skips drawing when no style is provided', () => {
        quagga.drawScannerArea({ top: '10%', left: '10%' });
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });

    it('skips drawing when geometry is default (all 0%/undefined)', () => {
        quagga.drawScannerArea({ backgroundColor: 'rgba(255,0,0,0.2)' });
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);

        quagga.drawScannerArea({ top: '0%', right: '0%', bottom: '0%', left: '0%', borderColor: '#0f0' });
        expect(mockCtx.fillRectCalls).to.equal(0);
        expect(mockCtx.strokeRectCalls).to.equal(0);
    });

    it('draws fill and stroke with correct geometry and styles', () => {
        quagga.drawScannerArea({
            top: '10%',
            right: '20%',
            bottom: '30%',
            left: '40%',
            backgroundColor: 'rgba(255,0,0,0.2)',
            borderColor: '#00ff00',
            borderWidth: 3,
        });

        // For canvas 200x100: x=80,y=10,w=80,h=60
        expect(mockCtx.lastFillArgs).to.deep.equal([80, 10, 80, 60]);
        expect(mockCtx.lastStrokeArgs).to.deep.equal([80, 10, 80, 60]);
        expect(mockCtx.fillStyle).to.equal('rgba(255,0,0,0.2)');
        expect(mockCtx.strokeStyle).to.equal('#00ff00');
        expect(mockCtx.lineWidth).to.equal(3);
    });

    it('defaults border width when only color is provided', () => {
        quagga.drawScannerArea({ top: '10%', right: '10%', bottom: '10%', left: '10%', borderColor: '#0f0' });
        expect(mockCtx.strokeRectCalls).to.equal(1);
        expect(mockCtx.lineWidth).to.equal(2); // default width
        expect(mockCtx.strokeStyle).to.equal('#0f0');
    });

    it('updates cached geometry when canvas size changes', () => {
        quagga.drawScannerArea({
            top: '10%', right: '20%', bottom: '30%', left: '40%', backgroundColor: 'rgba(0,0,255,0.1)'
        });
        // First call for 200x100: x=80,y=10,w=80,h=60
        expect(mockCtx.lastFillArgs).to.deep.equal([80, 10, 80, 60]);

        // Change canvas size and draw again
        size.x = 300; size.y = 200;
        quagga.drawScannerArea({
            top: '10%', right: '20%', bottom: '30%', left: '40%', backgroundColor: 'rgba(0,0,255,0.1)'
        });
        // Now for 300x200: x=120,y=20,w=120,h=120
        expect(mockCtx.lastFillArgs).to.deep.equal([120, 20, 120, 120]);
    });

    it('is invoked via publishResult when locate=false and area present', () => {
        // Provide area on config.inputStream
        (quagga.context.config as any).inputStream.area = {
            top: '10%', right: '10%', bottom: '10%', left: '10%', backgroundColor: 'rgba(255,0,0,0.2)'
        };
        quagga.publishResult();
        expect(mockCtx.fillRectCalls).to.be.greaterThan(0);
    });
});
