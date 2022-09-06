import { ImageDataArray } from '../../../type-definitions/quagga';
import { ImageDimensions } from './calculatePatchSize';
import computeGray from './computeGray';

// TODO: not used?
export default function grayArrayFromContext(
    ctx: CanvasRenderingContext2D,
    size: ImageDimensions,
    offset: ImageDimensions,
    array: ImageDataArray,
) {
    const ctxData = ctx.getImageData(offset.x, offset.y, size.x, size.y).data;
    computeGray(ctxData, array);
}
