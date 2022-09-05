import computeGray from "./computeGray";

export default function grayArrayFromContext(ctx, size, offset, array) {
    const ctxData = ctx.getImageData(offset.x, offset.y, size.x, size.y).data;
    computeGray(ctxData, array);
}
