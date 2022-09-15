import { ImageWrapper } from 'quagga';

// TODO: other threshold methods: https://docs.opencv.org/4.x/d7/d1b/group__imgproc__misc.html#ggaa9e58d2860d4afa658ef70a9b1115576a147222a96556ebc1d948b372bcd7ac59
// this appears to by default be an inverted binary threshold.

export default function thresholdImage(imageWrapper: ImageWrapper, threshold: number, thresholdMax = 1, targetWrapper = imageWrapper) {
    const imageData = imageWrapper.data;
    let { length } = imageData;
    const targetData = targetWrapper.data;

    while (length--) {
        targetData[length] = imageData[length] < threshold ? thresholdMax : 0;
    }
}
