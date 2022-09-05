// TODO: Not used?
import { ImageWrapper } from "quagga";

export default function bitwiseOr(aImageWrapper: ImageWrapper, bImageWrapper: ImageWrapper, outImageWrapper: ImageWrapper) {
    let { length } = aImageWrapper.data;
    const aImageData = aImageWrapper.data;
    const bImageData = bImageWrapper.data;
    const cImageData = outImageWrapper.data;

    while (length--) {
        cImageData[length] = aImageData[length] || bImageData[length];
    }
}
