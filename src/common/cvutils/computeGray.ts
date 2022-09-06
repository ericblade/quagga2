import { ImageDataArray, InputStreamConfig } from '../../../type-definitions/quagga';

export default function computeGray(imageData: ImageDataArray, outArray: ImageDataArray, config?: InputStreamConfig) {
    const l = Math.trunc(imageData.length / 4);

    if (config?.singleChannel === true) {
        for (let i = 0; i < l; i++) {
            // eslint-disable-next-line no-param-reassign
            outArray[i] = imageData[i * 4 + 0];
        }
    } else {
        for (let i = 0; i < l; i++) {
            // eslint-disable-next-line no-param-reassign
            outArray[i] = 0.299 * imageData[i * 4 + 0] + 0.587 * imageData[i * 4 + 1] + 0.114 * imageData[i * 4 + 2];
        }
    }
}
