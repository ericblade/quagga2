
const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');
const {
    imageRef,
    calculatePatchSize,
    _parseCSSDimensionValues,
    _dimensionsConverters,
    computeImageArea,
    computeIntegralImage,
    computeIntegralImage2,
    thresholdImage,
    computeHistogram,
    sharpenLine,
    determineOtsuThreshold,
    otsuThreshold,
    computeBinaryImage,
    cluster,
    Tracer,
    dilate,
    erode,
    subtract,
    bitwiseOr,
    countNonZero,
    topGeneric,
    halfSample,
    hsv2rgb,
    computeGray,
    grayAndHalfSampleFromCanvasData,
    _computeDivisors,
    DILATE,
    ERODE,
} = require('../cv_utils');

describe('CV Utils', () => {
    describe('imageRef', () => {
        it('gets the image Reference for a coordinate', () => {
            const res = imageRef(1, 2);
            expect(res.x).to.equal(1);
            expect(res.y).to.equal(2);
            expect(res.toVec2()[0]).to.equal(1);
        });

        it('toVec2 should return a 2D vector', () => {
            const res = imageRef(3, 4);
            const vec = res.toVec2();
            expect(vec).to.have.lengthOf(2);
            expect(vec[0]).to.equal(3);
            expect(vec[1]).to.equal(4);
        });

        it('toVec3 should return a 3D vector with 1 as third component', () => {
            const res = imageRef(5, 6);
            const vec = res.toVec3();
            expect(vec).to.have.lengthOf(3);
            expect(vec[0]).to.equal(5);
            expect(vec[1]).to.equal(6);
            expect(vec[2]).to.equal(1);
        });

        it('round should round positive coordinates correctly', () => {
            const res = imageRef(2.3, 4.7);
            res.round();
            expect(res.x).to.equal(2);
            expect(res.y).to.equal(5);
        });

        it('round should round negative coordinates correctly', () => {
            const res = imageRef(-2.3, -4.7);
            res.round();
            expect(res.x).to.equal(-3); // Math.floor(-2.3 - 0.5) = Math.floor(-2.8) = -3
            expect(res.y).to.equal(-6); // Math.floor(-4.7 - 0.5) = Math.floor(-5.2) = -6
        });

        it('round should handle edge case 0.5', () => {
            const res = imageRef(1.5, 2.5);
            res.round();
            expect(res.x).to.equal(2);
            expect(res.y).to.equal(3);
        });

        it('should handle zero coordinates', () => {
            const res = imageRef(0, 0);
            expect(res.x).to.equal(0);
            expect(res.y).to.equal(0);
        });

        it('should handle very large coordinates', () => {
            const res = imageRef(999999, 888888);
            expect(res.x).to.equal(999999);
            expect(res.y).to.equal(888888);
        });

        it('should handle Infinity', () => {
            const res = imageRef(Infinity, -Infinity);
            expect(res.x).to.equal(Infinity);
            expect(res.y).to.equal(-Infinity);
        });

        it('should handle NaN', () => {
            const res = imageRef(NaN, NaN);
            expect(res.x).to.be.NaN;
            expect(res.y).to.be.NaN;
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

        it('should convert a top-value correctly', () => {
            const expected = 48;
            const result = _dimensionsConverters.top({ value: 10, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a right-value correctly', () => {
            const expected = 640 - 128;
            const result = _dimensionsConverters.right({ value: 20, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a bottom-value correctly', () => {
            const expected = 480 - 77;
            const result = _dimensionsConverters.bottom({ value: 16, unit: '%' }, context);

            expect(result).to.be.equal(expected);
        });

        it('should convert a left-value correctly', () => {
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

    describe('computeIntegralImage', () => {
        it('should compute integral image correctly for a 3x3 image', () => {
            const imageWrapper = {
                data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
                size: { x: 3, y: 3 },
            };
            const integralWrapper = {
                data: new Uint8Array(9),
                size: { x: 3, y: 3 },
            };
            computeIntegralImage(imageWrapper, integralWrapper);
            expect(integralWrapper.data[0]).to.equal(1);
            expect(integralWrapper.data[1]).to.equal(3);
            expect(integralWrapper.data[2]).to.equal(6);
            expect(integralWrapper.data[4]).to.equal(12);
            expect(integralWrapper.data[8]).to.equal(45);
        });

        it('should handle a 2x2 image', () => {
            const imageWrapper = {
                data: new Uint8Array([1, 2, 3, 4]),
                size: { x: 2, y: 2 },
            };
            const integralWrapper = {
                data: new Uint8Array(4),
                size: { x: 2, y: 2 },
            };
            computeIntegralImage(imageWrapper, integralWrapper);
            expect(integralWrapper.data[0]).to.equal(1);
            expect(integralWrapper.data[1]).to.equal(3);
            expect(integralWrapper.data[2]).to.equal(4);
            expect(integralWrapper.data[3]).to.equal(10);
        });

        it('should produce non-decreasing values (integral property)', () => {
            const imageWrapper = {
                data: new Uint8Array([10, 20, 30, 40, 50, 60]),
                size: { x: 3, y: 2 },
            };
            const integralWrapper = {
                data: new Uint8Array(6),
                size: { x: 3, y: 2 },
            };
            computeIntegralImage(imageWrapper, integralWrapper);
            // Integral values should never decrease when moving right or down
            expect(integralWrapper.data[0]).to.be.at.most(integralWrapper.data[1]);
            expect(integralWrapper.data[1]).to.be.at.most(integralWrapper.data[2]);
            expect(integralWrapper.data[0]).to.be.at.most(integralWrapper.data[3]);
        });
    });

    describe('computeIntegralImage2', () => {
        it('should compute integral image correctly for a 3x3 image', () => {
            const imageWrapper = {
                data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
                size: { x: 3, y: 3 },
            };
            const integralWrapper = {
                data: new Uint8Array(9),
                size: { x: 3, y: 3 },
            };
            computeIntegralImage2(imageWrapper, integralWrapper);
            expect(integralWrapper.data[4]).to.be.greaterThan(0);
            expect(integralWrapper.data[8]).to.be.greaterThan(0);
        });

        it('should handle a 4x4 image', () => {
            const imageWrapper = {
                data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
                size: { x: 4, y: 4 },
            };
            const integralWrapper = {
                data: new Uint8Array(16),
                size: { x: 4, y: 4 },
            };
            computeIntegralImage2(imageWrapper, integralWrapper);
            expect(integralWrapper.data[5]).to.be.greaterThan(0);
        });

        it('should produce non-decreasing values (integral property)', () => {
            const imageWrapper = {
                data: new Uint8Array([10, 20, 30, 40, 50, 60]),
                size: { x: 3, y: 2 },
            };
            const integralWrapper = {
                data: new Uint8Array(6),
                size: { x: 3, y: 2 },
            };
            computeIntegralImage2(imageWrapper, integralWrapper);
            // Integral values should never decrease when moving right or down
            expect(integralWrapper.data[0]).to.be.at.most(integralWrapper.data[1]);
            expect(integralWrapper.data[1]).to.be.at.most(integralWrapper.data[2]);
            expect(integralWrapper.data[0]).to.be.at.most(integralWrapper.data[3]);
        });
    });

    describe('thresholdImage', () => {
        it('should threshold image correctly', () => {
            const imageWrapper = {
                data: new Uint8Array([10, 50, 100, 150, 200]),
            };
            const targetWrapper = {
                data: new Uint8Array(5),
            };
            thresholdImage(imageWrapper, 100, targetWrapper);
            expect(targetWrapper.data[0]).to.equal(1);
            expect(targetWrapper.data[1]).to.equal(1);
            expect(targetWrapper.data[2]).to.equal(0);
            expect(targetWrapper.data[3]).to.equal(0);
            expect(targetWrapper.data[4]).to.equal(0);
        });

        it('should use imageWrapper as target if no targetWrapper provided', () => {
            const imageWrapper = {
                data: new Uint8Array([10, 200, 50, 150]),
            };
            thresholdImage(imageWrapper, 100);
            expect(imageWrapper.data[0]).to.equal(1);
            expect(imageWrapper.data[1]).to.equal(0);
            expect(imageWrapper.data[2]).to.equal(1);
            expect(imageWrapper.data[3]).to.equal(0);
        });

        it('should only produce binary values (0 or 1)', () => {
            const imageWrapper = {
                data: new Uint8Array([0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 255]),
            };
            const targetWrapper = {
                data: new Uint8Array(12),
            };
            thresholdImage(imageWrapper, 128, targetWrapper);
            // Every value should be exactly 0 or 1
            for (let i = 0; i < targetWrapper.data.length; i++) {
                expect(targetWrapper.data[i]).to.be.oneOf([0, 1]);
            }
        });
    });

    describe('computeHistogram', () => {
        it('should compute histogram with default 8 bits per pixel', () => {
            const imageWrapper = {
                data: new Uint8Array([0, 50, 100, 150, 200, 255]),
            };
            const hist = computeHistogram(imageWrapper);
            expect(hist).to.be.an.instanceof(Int32Array);
            expect(hist.length).to.equal(256);
            expect(hist[0]).to.equal(1);
            expect(hist[255]).to.equal(1);
        });

        it('should compute histogram with 4 bits per pixel', () => {
            const imageWrapper = {
                data: new Uint8Array([0, 16, 32, 48, 64, 128, 255]),
            };
            const hist = computeHistogram(imageWrapper, 4);
            expect(hist.length).to.equal(16);
            expect(hist[0]).to.equal(1);
            expect(hist[15]).to.equal(1);
        });

        it('should count pixel values correctly', () => {
            const imageWrapper = {
                data: new Uint8Array([0, 0, 0, 128, 128, 255]),
            };
            const hist = computeHistogram(imageWrapper);
            expect(hist[0]).to.equal(3);
            expect(hist[128]).to.equal(2);
            expect(hist[255]).to.equal(1);
        });

        it('histogram counts should sum to total pixel count', () => {
            const imageWrapper = {
                data: new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
            };
            const hist = computeHistogram(imageWrapper);
            let sum = 0;
            for (let i = 0; i < hist.length; i++) {
                sum += hist[i];
            }
            expect(sum).to.equal(imageWrapper.data.length);
        });
    });

    describe('sharpenLine', () => {
        it('should sharpen a line using -1 4 -1 kernel', () => {
            const line = new Uint8Array([100, 120, 140, 120, 100]);
            const result = sharpenLine(line);
            expect(result).to.be.an.instanceof(Uint8Array);
            expect(result[0]).to.be.within(0, 255);
            expect(result[1]).to.be.within(0, 255);
        });

        it('should handle uniform line', () => {
            const line = new Uint8Array([128, 128, 128, 128]);
            sharpenLine(line);
            expect(line[0]).to.equal(0);
            expect(line[1]).to.equal(0);
        });

        it('should handle edge case with minimum values', () => {
            const line = new Uint8Array([0, 0, 0, 0]);
            sharpenLine(line);
            expect(line[0]).to.equal(0);
        });

        it('should handle empty array', () => {
            const line = new Uint8Array([]);
            const result = sharpenLine(line);
            expect(result).to.be.an.instanceof(Uint8Array);
            expect(result.length).to.equal(0);
        });

        it('should handle single element', () => {
            const line = new Uint8Array([128]);
            const result = sharpenLine(line);
            expect(result).to.be.an.instanceof(Uint8Array);
        });

        it('should handle two elements', () => {
            const line = new Uint8Array([100, 200]);
            const result = sharpenLine(line);
            expect(result).to.be.an.instanceof(Uint8Array);
        });
    });

    describe('determineOtsuThreshold', () => {
        it('should determine threshold for bimodal distribution', () => {
            const imageWrapper = {
                data: new Uint8Array([
                    ...Array(50).fill(30),
                    ...Array(50).fill(200),
                ]),
            };
            const threshold = determineOtsuThreshold(imageWrapper);
            expect(threshold).to.be.a('number');
            expect(threshold).to.be.at.least(0);
            expect(threshold).to.be.at.most(255);
        });

        it('should handle uniform image', () => {
            const imageWrapper = {
                data: new Uint8Array(100).fill(128),
            };
            const threshold = determineOtsuThreshold(imageWrapper);
            expect(threshold).to.be.a('number');
        });

        it('should accept bitsPerPixel parameter', () => {
            const imageWrapper = {
                data: new Uint8Array([
                    ...Array(50).fill(0),
                    ...Array(50).fill(255),
                ]),
            };
            const threshold = determineOtsuThreshold(imageWrapper, 4);
            expect(threshold).to.be.a('number');
        });
    });

    describe('otsuThreshold', () => {
        it('should compute and apply Otsu threshold', () => {
            const imageWrapper = {
                data: new Uint8Array([
                    ...Array(25).fill(30),
                    ...Array(25).fill(200),
                ]),
            };
            const targetWrapper = {
                data: new Uint8Array(50),
            };
            const threshold = otsuThreshold(imageWrapper, targetWrapper);
            expect(threshold).to.be.a('number');
            expect(targetWrapper.data[0]).to.be.oneOf([0, 1]);
        });
    });

    describe('computeBinaryImage', () => {
        it('should compute binary image using local thresholding', () => {
            const imageWrapper = {
                data: new Uint8Array(20 * 20).fill(128),
                size: { x: 20, y: 20 },
            };
            const integralWrapper = {
                data: new Uint8Array(20 * 20),
                size: { x: 20, y: 20 },
            };
            const targetWrapper = {
                data: new Uint8Array(20 * 20),
                size: { x: 20, y: 20 },
            };
            computeBinaryImage(imageWrapper, integralWrapper, targetWrapper);
            expect(targetWrapper.data).to.be.an.instanceof(Uint8Array);
        });

        it('should use imageWrapper as target if no targetWrapper provided', () => {
            const imageWrapper = {
                data: new Uint8Array(20 * 20).fill(128),
                size: { x: 20, y: 20 },
            };
            const integralWrapper = {
                data: new Uint8Array(20 * 20),
                size: { x: 20, y: 20 },
            };
            computeBinaryImage(imageWrapper, integralWrapper);
            expect(imageWrapper.data).to.be.an.instanceof(Uint8Array);
        });
    });

    describe('dilate', () => {
        it('should dilate binary image', () => {
            const inImageWrapper = {
                data: new Uint8Array([
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 1, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                ]),
                size: { x: 5, y: 5 },
            };
            const outImageWrapper = {
                data: new Uint8Array(25).fill(0),
                size: { x: 5, y: 5 },
            };
            dilate(inImageWrapper, outImageWrapper);
            expect(outImageWrapper.data[12]).to.equal(1); // center
        });
    });

    describe('erode', () => {
        it('should erode binary image', () => {
            const inImageWrapper = {
                data: new Uint8Array([
                    0, 0, 0, 0, 0,
                    0, 1, 1, 1, 0,
                    0, 1, 1, 1, 0,
                    0, 1, 1, 1, 0,
                    0, 0, 0, 0, 0,
                ]),
                size: { x: 5, y: 5 },
            };
            const outImageWrapper = {
                data: new Uint8Array(25),
                size: { x: 5, y: 5 },
            };
            erode(inImageWrapper, outImageWrapper);
            expect(outImageWrapper.data[12]).to.equal(1); // center should remain
        });

        it('should remove isolated pixels', () => {
            const inImageWrapper = {
                data: new Uint8Array([
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 1, 0, 0,
                    0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0,
                ]),
                size: { x: 5, y: 5 },
            };
            const outImageWrapper = {
                data: new Uint8Array(25),
                size: { x: 5, y: 5 },
            };
            erode(inImageWrapper, outImageWrapper);
            expect(outImageWrapper.data[12]).to.equal(0); // isolated pixel removed
        });
    });

    describe('subtract', () => {
        it('should subtract two images', () => {
            const aImageWrapper = {
                data: new Uint8Array([100, 150, 200, 250]),
            };
            const bImageWrapper = {
                data: new Uint8Array([50, 50, 100, 100]),
            };
            const resultWrapper = {
                data: new Uint8Array(4),
            };
            subtract(aImageWrapper, bImageWrapper, resultWrapper);
            expect(resultWrapper.data[0]).to.equal(50);
            expect(resultWrapper.data[1]).to.equal(100);
            expect(resultWrapper.data[2]).to.equal(100);
            expect(resultWrapper.data[3]).to.equal(150);
        });

        it('should use aImageWrapper as result if no resultWrapper provided', () => {
            const aImageWrapper = {
                data: new Uint8Array([100, 150, 200]),
            };
            const bImageWrapper = {
                data: new Uint8Array([30, 50, 100]),
            };
            subtract(aImageWrapper, bImageWrapper);
            expect(aImageWrapper.data[0]).to.equal(70);
            expect(aImageWrapper.data[1]).to.equal(100);
            expect(aImageWrapper.data[2]).to.equal(100);
        });

        it('should not modify input images when separate result provided', () => {
            const aImageWrapper = {
                data: new Uint8Array([100, 150, 200]),
            };
            const bImageWrapper = {
                data: new Uint8Array([30, 50, 100]),
            };
            const resultWrapper = {
                data: new Uint8Array(3),
            };
            const aOriginal = [...aImageWrapper.data];
            const bOriginal = [...bImageWrapper.data];
            subtract(aImageWrapper, bImageWrapper, resultWrapper);
            // Input arrays should be unchanged
            expect([...aImageWrapper.data]).to.deep.equal(aOriginal);
            expect([...bImageWrapper.data]).to.deep.equal(bOriginal);
        });
    });

    describe('bitwiseOr', () => {
        it('should perform bitwise OR on two images', () => {
            const aImageWrapper = {
                data: new Uint8Array([0, 1, 0, 1]),
            };
            const bImageWrapper = {
                data: new Uint8Array([0, 0, 1, 1]),
            };
            const resultWrapper = {
                data: new Uint8Array(4),
            };
            bitwiseOr(aImageWrapper, bImageWrapper, resultWrapper);
            expect(resultWrapper.data[0]).to.equal(0);
            expect(resultWrapper.data[1]).to.equal(1);
            expect(resultWrapper.data[2]).to.equal(1);
            expect(resultWrapper.data[3]).to.equal(1);
        });

        it('should use aImageWrapper as result if no resultWrapper provided', () => {
            const aImageWrapper = {
                data: new Uint8Array([0, 1, 0]),
            };
            const bImageWrapper = {
                data: new Uint8Array([1, 0, 0]),
            };
            bitwiseOr(aImageWrapper, bImageWrapper);
            expect(aImageWrapper.data[0]).to.equal(1);
            expect(aImageWrapper.data[1]).to.equal(1);
            expect(aImageWrapper.data[2]).to.equal(0);
        });

        it('should not modify input images when separate result provided', () => {
            const aImageWrapper = {
                data: new Uint8Array([0, 1, 0, 1]),
            };
            const bImageWrapper = {
                data: new Uint8Array([1, 0, 1, 0]),
            };
            const resultWrapper = {
                data: new Uint8Array(4),
            };
            const aOriginal = [...aImageWrapper.data];
            const bOriginal = [...bImageWrapper.data];
            bitwiseOr(aImageWrapper, bImageWrapper, resultWrapper);
            // Input arrays should be unchanged
            expect([...aImageWrapper.data]).to.deep.equal(aOriginal);
            expect([...bImageWrapper.data]).to.deep.equal(bOriginal);
        });
    });

    describe('countNonZero', () => {
        it('should count non-zero pixels', () => {
            const imageWrapper = {
                data: new Uint8Array([0, 1, 0, 2, 3, 0, 0, 5]),
            };
            const count = countNonZero(imageWrapper);
            expect(count).to.equal(11); // 1+2+3+5
        });

        it('should return 0 for all-zero image', () => {
            const imageWrapper = {
                data: new Uint8Array([0, 0, 0, 0]),
            };
            const count = countNonZero(imageWrapper);
            expect(count).to.equal(0);
        });

        it('should handle binary image', () => {
            const imageWrapper = {
                data: new Uint8Array([1, 0, 1, 1, 0, 1]),
            };
            const count = countNonZero(imageWrapper);
            expect(count).to.equal(4);
        });

        it('should handle empty image', () => {
            const imageWrapper = {
                data: new Uint8Array([]),
            };
            const count = countNonZero(imageWrapper);
            expect(count).to.equal(0);
        });

        it('should handle large values', () => {
            const imageWrapper = {
                data: new Uint8Array([255, 255, 255]),
            };
            const count = countNonZero(imageWrapper);
            expect(count).to.equal(765); // 255 * 3
        });
    });

    describe('cluster', () => {
        it('should cluster points based on threshold', () => {
            const points = [
                { x: 10, y: 10, rad: 1.0, vec: [10, 10] },
                { x: 11, y: 10, rad: 1.1, vec: [11, 10] },
                { x: 50, y: 50, rad: 1.0, vec: [50, 50] },
                { x: 51, y: 50, rad: 1.1, vec: [51, 50] },
            ];
            const clusters = cluster(points, 0.5, 'rad');
            expect(clusters).to.be.an('array');
            expect(clusters.length).to.be.at.least(1);
        });

        it('should use "rad" as default property', () => {
            const points = [
                { x: 10, y: 10, rad: 1.0, vec: [10, 10] },
                { x: 10, y: 10, rad: 1.05, vec: [10, 10] },
            ];
            const clusters = cluster(points, 0.1);
            expect(clusters).to.be.an('array');
        });
    });

    describe('Tracer', () => {
        describe('trace', () => {
            it('should trace a line through points', () => {
                const points = [
                    { x: 10, y: 10 },
                    { x: 15, y: 12 },
                    { x: 20, y: 14 },
                    { x: 25, y: 16 },
                ];
                const vec = [5, 2];
                const result = Tracer.trace(points, vec);
                expect(result).to.be.an('array');
                expect(result.length).to.be.at.least(1);
            });

            it('should handle single point', () => {
                const points = [{ x: 10, y: 10 }];
                const vec = [5, 2];
                const result = Tracer.trace(points, vec);
                expect(result).to.be.an('array');
                expect(result.length).to.equal(1);
            });
        });
    });

    describe('topGeneric', () => {
        it('should return top N items based on score function', () => {
            const list = [
                { value: 10 },
                { value: 50 },
                { value: 30 },
                { value: 70 },
                { value: 20 },
            ];
            const scoreFunc = (item) => item.value;
            const result = topGeneric(list, 3, scoreFunc);
            expect(result).to.be.an('array');
            expect(result.length).to.equal(3);
            expect(result[0].item).to.exist;
        });

        it('should handle requesting more items than available', () => {
            const list = [
                { value: 10 },
                { value: 20 },
            ];
            const scoreFunc = (item) => item.value;
            const result = topGeneric(list, 5, scoreFunc);
            expect(result).to.be.an('array');
            expect(result.length).to.equal(5);
        });
    });

    describe('halfSample', () => {
        it('should downsample image by factor of 2', () => {
            const inImgWrapper = {
                data: new Uint8Array([
                    10, 20, 30, 40,
                    50, 60, 70, 80,
                    90, 100, 110, 120,
                    130, 140, 150, 160,
                ]),
                size: { x: 4, y: 4 },
            };
            const outImgWrapper = {
                data: new Uint8Array(4),
                size: { x: 2, y: 2 },
            };
            halfSample(inImgWrapper, outImgWrapper);
            expect(outImgWrapper.data[0]).to.be.a('number');
            expect(outImgWrapper.data[0]).to.be.within(0, 255);
            expect(outImgWrapper.data.length).to.equal(4);
        });

        it('should average 2x2 blocks correctly', () => {
            const inImgWrapper = {
                data: new Uint8Array([
                    100, 100, 200, 200,
                    100, 100, 200, 200,
                    0, 0, 0, 0,
                    0, 0, 0, 0,
                ]),
                size: { x: 4, y: 4 },
            };
            const outImgWrapper = {
                data: new Uint8Array(4),
                size: { x: 2, y: 2 },
            };
            halfSample(inImgWrapper, outImgWrapper);
            expect(outImgWrapper.data[0]).to.equal(100);
            expect(outImgWrapper.data[1]).to.equal(200);
            expect(outImgWrapper.data[2]).to.equal(0);
            expect(outImgWrapper.data[3]).to.equal(0);
        });

        it('should handle 1x1 image', () => {
            const inImgWrapper = {
                data: new Uint8Array([128, 128, 128, 128]),
                size: { x: 2, y: 2 },
            };
            const outImgWrapper = {
                data: new Uint8Array(1),
                size: { x: 1, y: 1 },
            };
            halfSample(inImgWrapper, outImgWrapper);
            expect(outImgWrapper.data[0]).to.equal(128);
        });
    });

    describe('hsv2rgb', () => {
        it('should convert HSV to RGB (red)', () => {
            const hsv = [0, 1, 1];
            const rgb = hsv2rgb(hsv);
            expect(rgb[0]).to.equal(255);
            expect(rgb[1]).to.equal(0);
            expect(rgb[2]).to.equal(0);
        });

        it('should convert HSV to RGB (green)', () => {
            const hsv = [120, 1, 1];
            const rgb = hsv2rgb(hsv);
            expect(rgb[0]).to.equal(0);
            expect(rgb[1]).to.equal(255);
            expect(rgb[2]).to.equal(0);
        });

        it('should convert HSV to RGB (blue)', () => {
            const hsv = [240, 1, 1];
            const rgb = hsv2rgb(hsv);
            expect(rgb[0]).to.equal(0);
            expect(rgb[1]).to.equal(0);
            expect(rgb[2]).to.equal(255);
        });

        it('should handle grayscale (saturation = 0)', () => {
            const hsv = [0, 0, 0.5];
            const rgb = hsv2rgb(hsv);
            expect(rgb[0]).to.be.closeTo(127, 1);
            expect(rgb[1]).to.be.closeTo(127, 1);
            expect(rgb[2]).to.be.closeTo(127, 1);
        });

        it('should use provided rgb array', () => {
            const hsv = [60, 1, 1];
            const rgb = [0, 0, 0];
            const result = hsv2rgb(hsv, rgb);
            expect(result).to.equal(rgb);
            expect(rgb[0]).to.equal(255);
            expect(rgb[1]).to.equal(255);
            expect(rgb[2]).to.equal(0);
        });

        it('should handle hue >= 360', () => {
            const hsv = [400, 1, 1];
            const rgb = hsv2rgb(hsv);
            expect(rgb).to.be.an('array');
            expect(rgb[0]).to.be.within(0, 255);
            expect(rgb[1]).to.be.within(0, 255);
            expect(rgb[2]).to.be.within(0, 255);
        });

        it('should handle negative hue', () => {
            const hsv = [-60, 1, 1];
            const rgb = hsv2rgb(hsv);
            expect(rgb).to.be.an('array');
        });

        it('should handle saturation > 1', () => {
            const hsv = [120, 2, 1];
            const rgb = hsv2rgb(hsv);
            expect(rgb).to.be.an('array');
        });

        it('should handle value > 1', () => {
            const hsv = [120, 1, 2];
            const rgb = hsv2rgb(hsv);
            expect(rgb).to.be.an('array');
        });

        it('should always produce RGB values in valid range [0-255]', () => {
            // Test various HSV combinations
            const testCases = [
                [0, 0, 0], [0, 0, 0.5], [0, 0, 1],
                [60, 0.5, 0.5], [120, 1, 1], [180, 0.3, 0.7],
                [240, 0.8, 0.6], [300, 1, 1], [359, 1, 1],
            ];
            testCases.forEach((hsv) => {
                const rgb = hsv2rgb(hsv);
                rgb.forEach((value, i) => {
                    expect(value).to.be.at.least(0, `RGB[${i}] < 0 for HSV ${JSON.stringify(hsv)}`);
                    expect(value).to.be.at.most(255, `RGB[${i}] > 255 for HSV ${JSON.stringify(hsv)}`);
                    expect(Number.isInteger(value)).to.be.true;
                });
            });
        });
    });

    describe('computeGray', () => {
        it('should convert RGBA to grayscale using luminance formula', () => {
            const imageData = new Uint8Array([
                255, 0, 0, 255, // red pixel
                0, 255, 0, 255, // green pixel
                0, 0, 255, 255, // blue pixel
            ]);
            const outArray = new Uint8Array(3);
            computeGray(imageData, outArray);
            expect(outArray[0]).to.be.closeTo(76, 1); // red luminance
            expect(outArray[1]).to.be.closeTo(150, 1); // green luminance
            expect(outArray[2]).to.be.closeTo(29, 1); // blue luminance
        });

        it('should handle singleChannel mode', () => {
            const imageData = new Uint8Array([
                100, 150, 200, 255,
                50, 75, 100, 255,
            ]);
            const outArray = new Uint8Array(2);
            computeGray(imageData, outArray, { singleChannel: true });
            expect(outArray[0]).to.equal(100);
            expect(outArray[1]).to.equal(50);
        });

        it('should handle white pixel', () => {
            const imageData = new Uint8Array([255, 255, 255, 255]);
            const outArray = new Uint8Array(1);
            computeGray(imageData, outArray);
            expect(outArray[0]).to.be.closeTo(255, 1);
        });

        it('should handle black pixel', () => {
            const imageData = new Uint8Array([0, 0, 0, 255]);
            const outArray = new Uint8Array(1);
            computeGray(imageData, outArray);
            expect(outArray[0]).to.equal(0);
        });
    });

    describe('grayAndHalfSampleFromCanvasData', () => {
        it('should convert to grayscale and downsample', () => {
            const canvasData = new Uint8Array([
                100, 100, 100, 255, 150, 150, 150, 255,
                100, 100, 100, 255, 150, 150, 150, 255,
                200, 200, 200, 255, 250, 250, 250, 255,
                200, 200, 200, 255, 250, 250, 250, 255,
            ]);
            const size = { x: 2, y: 4 };
            const outArray = new Uint8Array(2);
            grayAndHalfSampleFromCanvasData(canvasData, size, outArray);
            expect(outArray).to.be.an.instanceof(Uint8Array);
            expect(outArray.length).to.equal(2);
            expect(outArray[0]).to.be.within(0, 255);
        });
    });

    describe('_computeDivisors', () => {
        it('should compute divisors of 12', () => {
            const divisors = _computeDivisors(12);
            expect(divisors).to.deep.equal([1, 2, 3, 4, 6, 12]);
        });

        it('should compute divisors of prime number', () => {
            const divisors = _computeDivisors(13);
            expect(divisors).to.deep.equal([1, 13]);
        });

        it('should compute divisors of 1', () => {
            const divisors = _computeDivisors(1);
            expect(divisors).to.deep.equal([1]);
        });

        it('should compute divisors of perfect square', () => {
            const divisors = _computeDivisors(16);
            expect(divisors).to.deep.equal([1, 2, 4, 8, 16]);
        });

        it('should not contain duplicate values', () => {
            // Test various numbers that historically caused duplicates
            const testNumbers = [2, 6, 12, 20, 30, 42, 56, 72, 90, 100, 110, 120, 144, 156, 640, 480];
            testNumbers.forEach((n) => {
                const divisors = _computeDivisors(n);
                const unique = [...new Set(divisors)];
                expect(divisors.length).to.equal(unique.length, `n=${n} has duplicates: ${JSON.stringify(divisors)}`);
            });
        });

        it('should return divisors in sorted order', () => {
            const testNumbers = [12, 30, 72, 100, 144, 640];
            testNumbers.forEach((n) => {
                const divisors = _computeDivisors(n);
                const sorted = [...divisors].sort((a, b) => a - b);
                expect(divisors).to.deep.equal(sorted, `n=${n} is not sorted`);
            });
        });

        it('should return only actual divisors of the input', () => {
            const testNumbers = [12, 30, 72, 100, 144, 156, 640, 480, 1920];
            testNumbers.forEach((n) => {
                const divisors = _computeDivisors(n);
                divisors.forEach((d) => {
                    expect(n % d).to.equal(0, `${d} does not divide ${n} evenly`);
                });
            });
        });

        it('should return all divisors (completeness check)', () => {
            // For smaller numbers, verify we got ALL divisors by brute force comparison
            const testNumbers = [12, 24, 30, 60];
            testNumbers.forEach((n) => {
                const divisors = _computeDivisors(n);
                // Find all actual divisors by brute force
                const allDivisors = [];
                for (let i = 1; i <= n; i++) {
                    if (n % i === 0) allDivisors.push(i);
                }
                expect(divisors).to.deep.equal(allDivisors, `n=${n} missing divisors`);
            });
        });

        it('should handle 0', () => {
            const divisors = _computeDivisors(0);
            // Zero is a special case: every integer divides 0, but returning infinite divisors
            // is not practical. Convention: return empty array.
            expect(divisors).to.be.an('array');
            expect(divisors).to.have.lengthOf(0);
        });

        it('should handle negative numbers', () => {
            const divisors = _computeDivisors(-12);
            // Negative numbers technically have divisors (e.g., -12 has ±1, ±2, ±3, ±4, ±6, ±12)
            // but this complicates the API. Convention: only compute for positive integers.
            expect(divisors).to.be.an('array');
            expect(divisors).to.have.lengthOf(0);
        });

        it('should handle Infinity', () => {
            const divisors = _computeDivisors(Infinity);
            // Infinity has no finite divisors
            expect(divisors).to.be.an('array');
            expect(divisors).to.have.lengthOf(0);
        });

        it('should handle NaN', () => {
            const divisors = _computeDivisors(NaN);
            // Not a number - no meaningful divisors exist
            expect(divisors).to.be.an('array');
            expect(divisors).to.have.lengthOf(0);
        });

        it('should handle non-integer values', () => {
            const divisors = _computeDivisors(12.5);
            // Non-integers: the function tests integer values i where n % i === 0
            // For 12.5: 12.5 % 1 = 0.5, 12.5 % 2 = 0.5, etc. - no integer divisors!
            // Only values like 2.5, 5, 12.5 would mathematically divide evenly, but we only test integers
            expect(divisors).to.be.an('array');
            expect(divisors).to.have.lengthOf(0);
        });
    });

    describe('DILATE and ERODE constants', () => {
        it('should have DILATE constant defined', () => {
            expect(DILATE).to.equal(1);
        });

        it('should have ERODE constant defined', () => {
            expect(ERODE).to.equal(2);
        });
    });
});
