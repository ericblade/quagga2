/* eslint-disable no-param-reassign */
import { ImageDataArray, InputStreamConfig } from '../../../type-definitions/quagga';

export default function computeGray(imageData: ImageDataArray, outArray: ImageDataArray, config?: InputStreamConfig) {
    const numPixels = Math.trunc(imageData.length / 4);

    if (config?.singleChannel === true) {
        for (let i = 0; i < numPixels; i++) {
            outArray[i] = imageData[i * 4 + 0];
        }
    } else {
        for (let i = 0; i < numPixels; i++) {
            const red = imageData[i * 4];
            const green = imageData[i * 4 + 1];
            const blue = imageData[i * 4 + 2];
            outArray[i] = 0.299 * red + 0.587 * green + 0.114 * blue;
            // outArray[i] = (red / 3) + (green / 3) + (blue / 3); // faster, blows a lot more tests
            // outArray[i] = (0.2126 * red ** 2.2 + 0.7152 * green ** 2.2 + 0.0722 * blue ** 2.2) ** (1/2.2); // much slower, blows a few more tests
        }
    }
}
