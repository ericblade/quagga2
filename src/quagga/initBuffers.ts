import ImageWrapper from '../common/image_wrapper';
import BarcodeLocator from '../locator/barcode_locator';
import { clone } from 'gl-vec2';
import { QuaggaBuildEnvironment } from '../../type-definitions/quagga';

declare var ENV: QuaggaBuildEnvironment;

// TODO: need typescript def for inputstream
// TODO: need typescript def for BarcodeLocator
export default function initBuffers(inputStream: any, imageWrapper: ImageWrapper, locator: any) {
    const inputImageWrapper = imageWrapper ? imageWrapper : new ImageWrapper({
        x: inputStream.getWidth(),
        y: inputStream.getHeight(),
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
