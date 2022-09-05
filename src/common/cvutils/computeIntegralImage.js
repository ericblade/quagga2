export default function computeIntegralImage(imageWrapper, integralWrapper) {
    const imageData = imageWrapper.data;
    const width = imageWrapper.size.x;
    const height = imageWrapper.size.y;
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
