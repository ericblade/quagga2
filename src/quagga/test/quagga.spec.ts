/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import Quagga from '../quagga';
import type { Box } from '../transform';

describe('src/quagga/quagga.ts', () => {
    describe('transformResult', () => {
        let quagga: Quagga;

        beforeEach(() => {
            quagga = new Quagga();
            // Mock the input stream with a non-zero top-right offset
            quagga.context.inputStream = {
                getTopRight: () => ({ x: 100, y: 50 }),
            } as any;
        });

        it('should transform result.box when present', () => {
            const result = {
                box: [[0, 0], [320, 0], [320, 240], [0, 240]] as Box,
            };
            quagga.transformResult(result);
            expect(result.box).to.deep.equal([[100, 50], [420, 50], [420, 290], [100, 290]]);
        });

        it('should transform result.boxes when present', () => {
            const result = {
                boxes: [
                    [[0, 0], [320, 0], [320, 240], [0, 240]] as Box,
                    [[10, 10], [310, 10], [310, 230], [10, 230]] as Box,
                ],
            };
            quagga.transformResult(result);
            expect(result.boxes[0]).to.deep.equal([[100, 50], [420, 50], [420, 290], [100, 290]]);
            expect(result.boxes[1]).to.deep.equal([[110, 60], [410, 60], [410, 280], [110, 280]]);
        });

        it('should NOT double-transform when result.box is same reference as result.boxes[i]', () => {
            // This is the bug fix test case
            // result.box and result.boxes[0] are the SAME object reference
            // The fix ensures we only transform it once
            const sharedBox: Box = [[0, 0], [320, 0], [320, 240], [0, 240]];
            const result = {
                box: sharedBox,
                boxes: [sharedBox],  // Same reference as result.box
            };

            quagga.transformResult(result);

            // Should only be transformed once (offset by 100, 50)
            // NOT twice (which would be offset by 200, 100)
            expect(result.box).to.deep.equal([[100, 50], [420, 50], [420, 290], [100, 290]]);
            expect(result.boxes[0]).to.deep.equal([[100, 50], [420, 50], [420, 290], [100, 290]]);
        });

        it('should transform both box and unrelated boxes separately', () => {
            // result.box is a different object from result.boxes entries
            const box1: Box = [[0, 0], [320, 0], [320, 240], [0, 240]];
            const box2: Box = [[10, 10], [310, 10], [310, 230], [10, 230]];
            const result = {
                box: box1,
                boxes: [box2],  // Different reference from result.box
            };

            quagga.transformResult(result);

            expect(result.box).to.deep.equal([[100, 50], [420, 50], [420, 290], [100, 290]]);
            expect(result.boxes[0]).to.deep.equal([[110, 60], [410, 60], [410, 280], [110, 280]]);
        });

        it('should not transform anything when offset is zero', () => {
            quagga.context.inputStream = {
                getTopRight: () => ({ x: 0, y: 0 }),
            } as any;

            const result = {
                box: [[0, 0], [320, 0], [320, 240], [0, 240]] as Box,
                boxes: [[[10, 10], [310, 10], [310, 230], [10, 230]] as Box],
            };

            quagga.transformResult(result);

            // Should remain unchanged
            expect(result.box).to.deep.equal([[0, 0], [320, 0], [320, 240], [0, 240]]);
            expect(result.boxes[0]).to.deep.equal([[10, 10], [310, 10], [310, 230], [10, 230]]);
        });

        it('should transform result.line when present', () => {
            const result = {
                line: [
                    { x: 10, y: 20 },
                    { x: 100, y: 200 },
                ],
            };

            quagga.transformResult(result);

            expect(result.line[0]).to.deep.include({ x: 110, y: 70 });
            expect(result.line[1]).to.deep.include({ x: 200, y: 250 });
        });
    });
});
