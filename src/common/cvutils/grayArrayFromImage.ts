import { ImageDataArray } from "../../../type-definitions/quagga";
import computeGray from "./computeGray";

// TODO: not used?
export default function grayArrayFromImage(htmlImage: ImageBitmap, offsetX: number, ctx: CanvasRenderingContext2D, array: ImageDataArray) {
    ctx.drawImage(htmlImage, offsetX, 0, htmlImage.width, htmlImage.height);
    const ctxData = ctx.getImageData(offsetX, 0, htmlImage.width, htmlImage.height).data;
    computeGray(ctxData, array);
}
