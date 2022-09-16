import { expect } from 'chai';
import { describe, it } from 'mocha';
import calculatePatchSize, { PatchSize } from '../calculatePatchSize';

describe('calculatePatchSize', () => {
    it('return null if patch size from given image size is smaller than 2', () => {
        const patchSize = calculatePatchSize(PatchSize.medium, { x: 35, y: 35 });
        expect(patchSize).to.deep.equal(null);
    });
    it('should return 32x32 for medium patch size on 640x480 image', () => {
        const expected = { x: 32, y: 32 };
        const patchSize = calculatePatchSize(PatchSize.medium, { x: 640, y: 480 });

        expect(patchSize).to.deep.equal(expected);
    });
});
