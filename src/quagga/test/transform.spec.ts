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
    });
    describe('moveLine', () => {
        it('moves the line coordinates passed to it', () => {
            const line: Transform.Line = [{ x: 10, y: 10, type: 'Point' }, { x: 10, y: 20, type: 'Point' }];
            Transform.moveLine(line, 10, -10);
            expect(line).to.deep.equal([{ x: 20, y: 0, type: 'Point' }, { x: 20, y: 10, type: 'Point' }]);
        });
    });
});
