
const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');
const {
    imageRef,
    calculatePatchSize,
    _parseCSSDimensionValues,
    _dimensionsConverters,
    computeImageArea,
} = require('../cv_utils');

describe('CV Utils', () => {
    describe('imageRef', () => {
        it('gets the image Reference for a coordinate', () => {
            const res = imageRef(1, 2);
            expect(res.x).to.equal(1);
            expect(res.y).to.equal(2);
            expect(res.toVec2()[0]).to.equal(1);
        });
    });

    describe('calculatePatchSize', () => {
        it('should not throw an error in case of valid image size', () => {
            const expected = { x: 32, y: 32 };
            const patchSize = calculatePatchSize('medium', { x: 640, y: 480 });

            expect(patchSize).to.deep.equal(expected);
        });

        it('should thow an error if image size it not valid', () => {
            const expected = { x: 32, y: 32 };
            const patchSize = calculatePatchSize('medium', { x: 640, y: 480 });

            expect(patchSize).to.deep.equal(expected);
        });
    });

    describe('_parseCSSDimensionValues', () => {
        it('should convert a percentual value correctly', () => {
            const expected = {
                value: 10,
                unit: '%',
            };
            const result = _parseCSSDimensionValues('10%');

            expect(result).to.deep.equal(expected);
        });

        it('should convert a 0% value correctly', () => {
            const expected = {
                value: 100,
                unit: '%',
            };
            const result = _parseCSSDimensionValues('100%');

            expect(result).to.deep.equal(expected);
        });

        it('should convert a 100% value correctly', () => {
            const expected = {
                value: 0,
                unit: '%',
            };
            const result = _parseCSSDimensionValues('0%');

            expect(result).to.deep.equal(expected);
        });

        it('should convert a pixel value to percentage', () => {
            const expected = {
                value: 26.3,
                unit: '%',
            };
            const result = _parseCSSDimensionValues('26.3px');

            // console.log(result);
            expect(result).to.deep.equal(expected);
        });
    });

    describe('_dimensionsConverters', () => {
        let context;

        beforeEach(() => {
            context = {
                width: 640,
                height: 480,
            };
        });

        it('should convert a top-value correclty', () => {
            const expected = 48;
            const result = _dimensionsConverters.top({ value: 10, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a right-value correclty', () => {
            const expected = 640 - 128;
            const result = _dimensionsConverters.right({ value: 20, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a bottom-value correclty', () => {
            const expected = 480 - 77;
            const result = _dimensionsConverters.bottom({ value: 16, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a left-value correclty', () => {
            const expected = 57;
            const result = _dimensionsConverters.left({ value: 9, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });
    });

    describe('computeImageArea', () => {
        it('should calculate an image-area', () => {
            const expected = {
                sx: 115,
                sy: 48,
                sw: 429,
                sh: 336,
            };
            const result = computeImageArea(640, 480, {
                top: '10%',
                right: '15%',
                bottom: '20%',
                left: '18%',
            });

            expect(result).to.deep.equal(expected);
        });

        it('should calculate full image-area', () => {
            const expected = {
                sx: 0,
                sy: 0,
                sw: 640,
                sh: 480,
            };
            const result = computeImageArea(640, 480, {
                top: '0%',
                right: '0%',
                bottom: '0%',
                left: '0%',
            });

            expect(result).to.deep.equal(expected);
        });
    });
});
