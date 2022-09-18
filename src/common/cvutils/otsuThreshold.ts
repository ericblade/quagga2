import ImageWrapper from '../image_wrapper';
import determineOtsuThreshold from './determineOtsuThreshold';
import thresholdImage from './thresholdImage';

export default function otsuThreshold(imageWrapper: ImageWrapper, targetWrapper: ImageWrapper, maxThreshold = 1) {
    const threshold = determineOtsuThreshold(imageWrapper);

    thresholdImage(imageWrapper, threshold, maxThreshold, targetWrapper);
    return threshold;
}
