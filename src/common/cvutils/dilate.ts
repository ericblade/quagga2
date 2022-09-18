import ImageWrapper from '../image_wrapper';

// TODO: not used?
export default function dilate(inImageWrapper: ImageWrapper, outImageWrapper: ImageWrapper) {
    let v;
    let u;
    const { data: inImageData } = inImageWrapper;
    const { data: outImageData } = outImageWrapper;
    const { y: height, x: width } = inImageWrapper.size;
    let sum;
    let yStart1;
    let yStart2;
    let xStart1;
    let xStart2;

    for (v = 1; v < height - 1; v++) {
        for (u = 1; u < width - 1; u++) {
            yStart1 = v - 1;
            yStart2 = v + 1;
            xStart1 = u - 1;
            xStart2 = u + 1;
            sum = inImageData[yStart1 * width + xStart1] + inImageData[yStart1 * width + xStart2]
                + inImageData[v * width + u]
                + inImageData[yStart2 * width + xStart1] + inImageData[yStart2 * width + xStart2];
            outImageData[v * width + u] = sum > 0 ? 1 : 0;
        }
    }
}
