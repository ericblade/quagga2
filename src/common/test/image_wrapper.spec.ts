import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import ImageWrapper from '../image_wrapper';

describe('Image Wrapper', () => {
    it('constructs', () => {
        const iw = new ImageWrapper({ x: 320, y: 240, type: 'XYSize' }, undefined, Uint8Array, true);
        expect(iw).to.be.an.instanceOf(ImageWrapper);
        expect(iw.data).to.be.a('Uint8Array').with.lengthOf(320 * 240);
        expect(iw.size).to.deep.equal({ x: 320, y: 240, type: 'XYSize' });
    });
    describe('inImageWithBorder', () => {
        let iw: ImageWrapper;
        // eslint-disable-next-line no-return-assign
        beforeEach(() => iw = new ImageWrapper({ x: 320, y: 240, type: 'XYSize' }, undefined, Uint8Array, true));
        it('returns true for location inside image', () => {
            expect(iw.inImageWithBorder({ x: 100, y: 100, type: 'XYSize' })).to.equal(true);
        });
        it('returns false for location outside image', () => {
            expect(iw.inImageWithBorder({ x: 1000, y: 1000, type: 'XYSize' })).to.equal(false);
        });
        it('returns true for locations inside border area', () => {
            expect(iw.inImageWithBorder({ x: 325, y: 245, type: 'XYSize' }, 15)).to.equal(true);
        });
        it('returns false for location outside image and border', () => {
            expect(iw.inImageWithBorder({ x: 330, y: 250, type: 'XYSize' }, 5)).to.equal(false);
        });
        it('throws with negative borders', () => {
            expect(iw.inImageWithBorder.bind(iw, { x: 320, y: 240, type: 'XYSize' }, -240)).to.throw();
        });
    });
    describe('subImageAsCopy', () => {
        let iw: ImageWrapper;
        // eslint-disable-next-line no-return-assign
        beforeEach(() => iw = new ImageWrapper({ x: 320, y: 240, type: 'XYSize' }, undefined, Uint8Array, true));
        it('returns a correctly sized image', () => {
            const testIW = iw.subImageAsCopy(new ImageWrapper({ x: 220, y: 140, type: 'XYSize' }), { x: 100, y: 100, type: 'XYSize' });
            expect(testIW).to.be.an.instanceOf(ImageWrapper);
            expect(testIW.data).to.be.a('Uint8Array').with.lengthOf(220 * 140);
            expect(testIW.size).to.deep.equal({ x: 220, y: 140, type: 'XYSize' });
        });
        it('TODO: write a test that does this with a real image and compares');
    });
    describe('set/get/getSafe', () => {
        let iw: ImageWrapper;
        // eslint-disable-next-line no-return-assign
        beforeEach(() => iw = new ImageWrapper({ x: 320, y: 240, type: 'XYSize' }, undefined, Uint8Array, true));
        it('set and get', () => {
            expect(iw.get(100, 100)).to.equal(0);
            iw.set(100, 100, 255);
            expect(iw.get(100, 100)).to.equal(255);
        });
        it('set and getSafe', () => {
            expect(iw.getSafe(100, 100)).to.equal(0);
            iw.set(100, 100, 255);
            expect(iw.getSafe(100, 100)).to.equal(255);
        });
        // Today, I learned that Uint8Array will silently ignore
        // out of bound sets, and return undefined for out of bounds
        // queries.
        it('get returns undefined for out-of-bounds', () => {
            expect(iw.get(5000, 5000)).to.equal(undefined);
        });
        it('set does nothing for out-of-bounds', () => {
            expect(iw.set.bind(iw, 5000, 5000, 5000)).to.not.throw();
        });
        it('getSafe returns undefined for out-of-bounds', () => {
            expect(iw.getSafe(5000, 5000)).to.equal(undefined);
        });
    });
    describe.skip('moments', () => {
        it('TODO');
    });
    describe('getAsRGBA', () => {
        let iw: ImageWrapper;
        // eslint-disable-next-line no-return-assign
        beforeEach(() => iw = new ImageWrapper({ x: 320, y: 240, type: 'XYSize' }, undefined, Uint8Array, true));
        it('returns a 1:1 copy by default', () => {
            iw.set(0, 0, 128);
            iw.set(200, 200, 227);
            const image = iw.getAsRGBA();
            // cy.log(`${JSON.stringify(image)}`);
            expect(image).to.be.a('Uint8ClampedArray').with.lengthOf(4 * 320 * 240);
            expect(image[0]).to.equal(128);
            expect(image[1]).to.equal(128);
            expect(image[2]).to.equal(128);
            expect(image[3]).to.equal(255);
            expect(image[4]).to.equal(0);
            const pixel = (200 * 320 + 200) * 4;
            expect(image[pixel + 0]).to.equal(227);
            expect(image[pixel + 1]).to.equal(227);
            expect(image[pixel + 2]).to.equal(227);
            expect(image[pixel + 3]).to.equal(255);
            expect(image[pixel + 4]).to.equal(0);
        });
        it('TODO: test rescaling');
    });
    describe('show', () => {
        it('TODO: create a CanvasElement and load an image into it and test this. expect it to blow up righteously in node');
    });
    describe('overlay', () => {
        it('TODO: same as show but for overlay');
    });
});
