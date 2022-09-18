// TODO: not used?
import ImageWrapper from '../image_wrapper';
import computeIntegralImage from './computeIntegralImage';

// local thresholding

export default function computeBinaryImage(imageWrapper: ImageWrapper, integralWrapper: ImageWrapper, targetWrapper: ImageWrapper) {
    computeIntegralImage(imageWrapper, integralWrapper);

    const imageData = imageWrapper.data;
    const targetData = targetWrapper.data;
    const width = imageWrapper.size.x;
    const height = imageWrapper.size.y;
    const integralImageData = integralWrapper.data;
    let sum = 0; let v; let u; const kernel = 3; let A; let B; let C; let D; let avg; const
        size = (kernel * 2 + 1) * (kernel * 2 + 1);

    // clear out top & bottom-border
    for (v = 0; v <= kernel; v++) {
        for (u = 0; u < width; u++) {
            targetData[((v) * width) + u] = 0;
            targetData[(((height - 1) - v) * width) + u] = 0;
        }
    }

    // clear out left & right border
    for (v = kernel; v < height - kernel; v++) {
        for (u = 0; u <= kernel; u++) {
            targetData[((v) * width) + u] = 0;
            targetData[((v) * width) + (width - 1 - u)] = 0;
        }
    }

    for (v = kernel + 1; v < height - kernel - 1; v++) {
        for (u = kernel + 1; u < width - kernel; u++) {
            A = integralImageData[(v - kernel - 1) * width + (u - kernel - 1)];
            B = integralImageData[(v - kernel - 1) * width + (u + kernel)];
            C = integralImageData[(v + kernel) * width + (u - kernel - 1)];
            D = integralImageData[(v + kernel) * width + (u + kernel)];
            sum = D - C - B + A;
            avg = sum / (size);
            targetData[v * width + u] = imageData[v * width + u] > (avg + 5) ? 0 : 1;
        }
    }
}
