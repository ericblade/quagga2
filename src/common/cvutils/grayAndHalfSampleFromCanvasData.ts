import { ImageDataArray } from '../../../type-definitions/quagga';
import { ImageDimensions } from './calculatePatchSize';

export default function grayAndHalfSampleFromCanvasData<T extends ImageDataArray>(
    canvasData: T,
    size: ImageDimensions,
    outArray: T,
) {
    let topRowIdx = 0;
    let bottomRowIdx = size.x;
    const endIdx = Math.floor(canvasData.length / 4);
    const outWidth = size.x / 2;
    let outImgIdx = 0;
    const inWidth = size.x;
    let i;

    while (bottomRowIdx < endIdx) {
        for (i = 0; i < outWidth; i++) {
            // eslint-disable-next-line no-param-reassign
            outArray[outImgIdx] = (
                (0.299 * canvasData[topRowIdx * 4 + 0]
                    + 0.587 * canvasData[topRowIdx * 4 + 1]
                    + 0.114 * canvasData[topRowIdx * 4 + 2])
                + (0.299 * canvasData[(topRowIdx + 1) * 4 + 0]
                    + 0.587 * canvasData[(topRowIdx + 1) * 4 + 1]
                    + 0.114 * canvasData[(topRowIdx + 1) * 4 + 2])
                + (0.299 * canvasData[(bottomRowIdx) * 4 + 0]
                    + 0.587 * canvasData[(bottomRowIdx) * 4 + 1]
                    + 0.114 * canvasData[(bottomRowIdx) * 4 + 2])
                + (0.299 * canvasData[(bottomRowIdx + 1) * 4 + 0]
                    + 0.587 * canvasData[(bottomRowIdx + 1) * 4 + 1]
                    + 0.114 * canvasData[(bottomRowIdx + 1) * 4 + 2])) / 4;
            outImgIdx++;
            topRowIdx += 2;
            bottomRowIdx += 2;
        }
        topRowIdx += inWidth;
        bottomRowIdx += inWidth;
    }
}
