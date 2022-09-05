import determineOtsuThreshold from './determineOtsuThreshold';
import thresholdImage from './thresholdImage';

export default function otsuThreshold(imageWrapper, targetWrapper) {
    const threshold = determineOtsuThreshold(imageWrapper);

    thresholdImage(imageWrapper, threshold, targetWrapper);
    return threshold;
}
