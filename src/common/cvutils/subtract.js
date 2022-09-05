export default function subtract(aImageWrapper, bImageWrapper, resultImageWrapper) {
    if (!resultImageWrapper) {
        // eslint-disable-next-line no-param-reassign
        resultImageWrapper = aImageWrapper;
    }
    let { length } = aImageWrapper.data;
    const aImageData = aImageWrapper.data;
    const bImageData = bImageWrapper.data;
    const cImageData = resultImageWrapper.data;

    while (length--) {
        cImageData[length] = aImageData[length] - bImageData[length];
    }
}
