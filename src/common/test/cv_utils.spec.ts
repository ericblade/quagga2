import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import computeImageArea, { dimensionsConverters } from '../cvutils/computeImageArea';
import ImageRef from '../cvutils/ImageRef';
import parseCSSDimensionValues from '../cvutils/parseCSSDimensionValues';

describe('CV Utils', () => {
    describe('ImageRef', () => {
        it('gets the image Reference for a coordinate', () => {
            const res = new ImageRef(1, 2);
            expect(res.x).to.equal(1);
            expect(res.y).to.equal(2);
            expect(res.toVec2()[0]).to.equal(1);
        });
    });

    describe('_parseCSSDimensionValues', () => {
        it('should convert a percentual value correctly', () => {
            const expected = {
                value: 10,
                unit: '%',
            };
            const result = parseCSSDimensionValues('10%');

            expect(result).to.deep.equal(expected);
        });

        it('should convert a 0% value correctly', () => {
            const expected = {
                value: 100,
                unit: '%',
            };
            const result = parseCSSDimensionValues('100%');

            expect(result).to.deep.equal(expected);
        });

        it('should convert a 100% value correctly', () => {
            const expected = {
                value: 0,
                unit: '%',
            };
            const result = parseCSSDimensionValues('0%');

            expect(result).to.deep.equal(expected);
        });

        it('should convert a pixel value to percentage', () => {
            const expected = {
                value: 26.3,
                unit: '%',
            };
            const result = parseCSSDimensionValues('26.3px');

            // console.log(result);
            expect(result).to.deep.equal(expected);
        });
    });

    describe('_dimensionsConverters', () => {
        let context: { height: number, width: number };

        beforeEach(() => {
            context = {
                width: 640,
                height: 480,
            };
        });

        it('should convert a top-value correclty', () => {
            const expected = 48;
            const result = dimensionsConverters.top({ value: 10, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a right-value correclty', () => {
            const expected = 640 - 128;
            const result = dimensionsConverters.right({ value: 20, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a bottom-value correclty', () => {
            const expected = 480 - 77;
            const result = dimensionsConverters.bottom({ value: 16, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a left-value correclty', () => {
            const expected = 57;
            const result = dimensionsConverters.left({ value: 9, unit: '%' }, context);

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
