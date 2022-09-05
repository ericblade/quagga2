export default function computeGray(imageData, outArray, config) {
    const l = (imageData.length / 4) | 0;
    const singleChannel = config && config.singleChannel === true;

    if (singleChannel) {
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
