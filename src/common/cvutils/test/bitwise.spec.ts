import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import ImageWrapper from '../../image_wrapper';
import * as bitwise from '../bitwise';

describe('bitwise image operations', () => {
    const data1 = new Uint8Array([0, 1, 2, 4, 8, 16, 32, 64, 128]);
    const data2 = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]);

    const expectedAnd = new Uint8Array([0, 1, 2, 4, 8, 16, 32, 64, 128]);
    const expectedOr = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255]);
    const expectedXor = new Uint8Array([255, 254, 253, 251, 247, 239, 223, 191, 127]);

    const expectedNot = new Uint8Array([255, 254, 253, 251, 247, 239, 223, 191, 127]);

    let aImg: ImageWrapper;
    let bImg: ImageWrapper;
    let cImg: ImageWrapper;

    beforeEach(() => {
        aImg = new ImageWrapper({ x: 3, y: 3 }, data1);
        bImg = new ImageWrapper({ x: 3, y: 3 }, data2);
        cImg = new ImageWrapper({ x: 3, y: 3 });
    });
    it('And', () => {
        bitwise.bitwiseAnd(aImg, bImg, cImg);
        expect(cImg.data).to.deep.equal(expectedAnd);
    });
    it('Or', () => {
        bitwise.bitwiseOr(aImg, bImg, cImg);
        expect(cImg.data).to.deep.equal(expectedOr);
    });
    it('Xor', () => {
        bitwise.bitwiseXor(aImg, bImg, cImg);
        expect(cImg.data).to.deep.equal(expectedXor);
    });
    it('Not', () => {
        bitwise.bitwiseNot(aImg, cImg);
        expect(cImg.data).to.deep.equal(expectedNot);
    });
});
