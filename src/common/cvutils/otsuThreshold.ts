import { ImageWrapper } from 'quagga';
import determineOtsuThreshold from './determineOtsuThreshold';
import thresholdImage from './thresholdImage';

export default function otsuThreshold(imageWrapper: ImageWrapper, targetWrapper: ImageWrapper) {
    const threshold = determineOtsuThreshold(imageWrapper);

    thresholdImage(imageWrapper, threshold, targetWrapper);
    return threshold;
}
