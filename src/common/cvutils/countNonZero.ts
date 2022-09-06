import { ImageWrapper } from "quagga";

// TODO: not used?
export default function countNonZero(imageWrapper: ImageWrapper) {
    let { length } = imageWrapper.data;
    const { data } = imageWrapper;
    let sum = 0;

    while (length--) {
        sum += data[length];
    }
    return sum;
}
