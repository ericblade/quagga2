export default function countNonZero(imageWrapper) {
    let { length } = imageWrapper.data;
    const { data } = imageWrapper;
    let sum = 0;

    while (length--) {
        sum += data[length];
    }
    return sum;
}
