import { expect } from 'chai';
import { describe, it } from 'mocha';
import ImageWrapper from '../../image_wrapper';
import thresholdImage from '../thresholdImage';

// Note: thresholdImage is an inverted binary threshold presently
describe('thresholdImage', () => {
    it('thresholds image to 255', () => {
        const img = new ImageWrapper({ x: 3, y: 1 }, [0, 100, 200]);
        thresholdImage(img, 200, 255);
        expect(img.data).to.deep.equal([255, 255, 0]);
    });
});
