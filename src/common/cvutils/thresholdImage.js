export default function thresholdImage(imageWrapper, threshold, targetWrapper) {
    if (!targetWrapper) {
        // eslint-disable-next-line no-param-reassign
        targetWrapper = imageWrapper;
    }
    const imageData = imageWrapper.data; let { length } = imageData; const
        targetData = targetWrapper.data;

    while (length--) {
        targetData[length] = imageData[length] < threshold ? 1 : 0;
    }
}
