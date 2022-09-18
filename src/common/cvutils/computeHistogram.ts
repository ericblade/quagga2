/* eslint-disable no-bitwise */
import ImageWrapper from '../image_wrapper';

export default function computeHistogram(imageWrapper: ImageWrapper, bitsPerPixel = 8) {
    const imageData = imageWrapper.data;
    let { length } = imageData;
    const bitShift = 8 - bitsPerPixel;
    const bucketCnt = 1 << bitsPerPixel;
    const hist = new Int32Array(bucketCnt);

    while (length--) {
        hist[imageData[length] >> bitShift]++;
    }
    return hist;
}
