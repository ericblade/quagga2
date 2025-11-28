import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as Transform from '../transform';

describe('src/quagga/transform', () => {
    describe('moveBox', () => {
        it('moves the box coordinates passed to it', () => {
            const box: Transform.Box = [[0, 0], [320, 240]];
            Transform.moveBox(box, 10, -10);
            expect(box).to.deep.equal([[10, -10], [330, 230]]);
        });

        // Test to document shared reference behavior - this test ensures that
        // when boxes share references (like result.box and result.boxes[i]),
        // calling moveBox on both would double-transform the shared box.
        // The fix in transformResult skips boxes that are the same reference as result.box.
        it('mutates the original box (shared reference issue)', () => {
            const box: Transform.Box = [[0, 0], [320, 240]];
            const boxes: Transform.Box[] = [box]; // boxes[0] is same reference as box

            // First transform on box
            Transform.moveBox(box, 10, 10);
            expect(box).to.deep.equal([[10, 10], [330, 250]]);

            // boxes[0] is the same reference, so it was also transformed
            expect(boxes[0]).to.deep.equal([[10, 10], [330, 250]]);

            // If we transformed boxes[0] again (without the fix), it would double-transform
            // Transform.moveBox(boxes[0], 10, 10);
            // This would result in [[20, 20], [340, 260]] - double the intended offset!
        });
    });
    describe('moveLine', () => {
        it('moves the line coordinates passed to it', () => {
            const line: Transform.Line = [{ x: 10, y: 10, type: 'Point' }, { x: 10, y: 20, type: 'Point' }];
            Transform.moveLine(line, 10, -10);
            expect(line).to.deep.equal([{ x: 20, y: 0, type: 'Point' }, { x: 20, y: 10, type: 'Point' }]);
        });
    });
});
