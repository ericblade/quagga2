import { clone } from 'gl-vec2';
import ImageWrapper from '../common/image_wrapper';
import BarcodeLocator from '../locator/barcode_locator';

// TODO: need typescript def for inputstream
// TODO: need typescript def for BarcodeLocator
export default function initBuffers(inputStream: any, imageWrapper: ImageWrapper | undefined, locator: any) {
    const inputImageWrapper = imageWrapper || new ImageWrapper({
        x: inputStream.getWidth(),
        y: inputStream.getHeight(),
        type: 'XYSize',
    });

    if (ENV.development) {
        console.log(`image wrapper size ${inputImageWrapper.size}`);
    }
    const boxSize = [
        clone([0, 0]),
        clone([0, inputImageWrapper.size.y]),
        clone([inputImageWrapper.size.x, inputImageWrapper.size.y]),
        clone([inputImageWrapper.size.x, 0]),
    ];
    BarcodeLocator.init(inputImageWrapper, locator);
    return { inputImageWrapper, boxSize };
}
