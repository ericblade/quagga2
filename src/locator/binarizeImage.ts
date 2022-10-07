import { type ImageWrapper } from 'quagga';
import { type ILocatorDebugConfig, type QuaggaJSStatic } from '../../type-definitions/quagga';
import otsuThreshold from '../common/cvutils/otsuThreshold';

/**
 * Creates a binary image of the current image
 */
function binarizeImage(currentImageWrapper: ImageWrapper, binaryImageWrapper: ImageWrapper, config: ILocatorDebugConfig, canvasContainer: QuaggaJSStatic["canvas"]) {
    otsuThreshold(currentImageWrapper, binaryImageWrapper);
    binaryImageWrapper.zeroBorder();
    if (ENV.development && config.showCanvas) {
        binaryImageWrapper.show(canvasContainer.dom.binary as HTMLCanvasElement, 255); // TODO: This is some wtf
    }
}

export default binarizeImage;
