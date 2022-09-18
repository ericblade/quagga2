import ImageWrapper from '../image_wrapper';

export default function computeIntegralImage(imageWrapper: ImageWrapper, integralWrapper: ImageWrapper) {
    const imageData = imageWrapper.data;
    const { x: width, y: height } = imageWrapper.size;
    const integralImageData = integralWrapper.data;
    let sum = 0;

    // sum up first row
    for (let i = 0; i < width; i++) {
        sum += imageData[i];
        integralImageData[i] = sum;
    }

    for (let v = 1; v < height; v++) {
        sum = 0;
        for (let u = 0; u < width; u++) {
            sum += imageData[v * width + u];
            integralImageData[((v) * width) + u] = sum + integralImageData[(v - 1) * width + u];
        }
    }
}
