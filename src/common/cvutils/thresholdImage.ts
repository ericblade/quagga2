import { ImageWrapper } from "quagga";

export default function thresholdImage(imageWrapper: ImageWrapper, threshold: number, targetWrapper = imageWrapper) {
    const imageData = imageWrapper.data;
    let { length } = imageData;
    const targetData = targetWrapper.data;

    while (length--) {
        targetData[length] = imageData[length] < threshold ? 1 : 0;
    }
}
