import ImageWrapper from '../image_wrapper';

// TODO: not used?
export default function subtract(aImageWrapper: ImageWrapper, bImageWrapper: ImageWrapper, resultImageWrapper = aImageWrapper) {
    let { length } = aImageWrapper.data;
    const aImageData = aImageWrapper.data;
    const bImageData = bImageWrapper.data;
    const cImageData = resultImageWrapper.data;

    while (length--) {
        cImageData[length] = aImageData[length] - bImageData[length];
    }
}
