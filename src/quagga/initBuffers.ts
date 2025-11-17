import { vec2 } from 'gl-matrix';
import ImageWrapper from '../common/image_wrapper';
import type { InputStream } from '../input/input_stream/input_stream.d';
import BarcodeLocator from '../locator/barcode_locator';

// TODO: need typescript def for BarcodeLocator
export default function initBuffers(
    inputStream: InputStream,
    imageWrapper: ImageWrapper | undefined,
    locator: any,
) {
    const inputImageWrapper = imageWrapper || new ImageWrapper({
        x: inputStream.getWidth(),
        y: inputStream.getHeight(),
        type: 'XYSize',
    });

    if (ENV.development && (locator as any).config?.debug?.showImageDetails) {
        console.log(`image wrapper size ${inputImageWrapper.size}`);
    }
    const boxSize = [
        vec2.clone([0, 0]),
        vec2.clone([0, inputImageWrapper.size.y]),
        vec2.clone([inputImageWrapper.size.x, inputImageWrapper.size.y]),
        vec2.clone([inputImageWrapper.size.x, 0]),
    ];
    BarcodeLocator.init(inputImageWrapper, locator);
    return { inputImageWrapper, boxSize };
}
