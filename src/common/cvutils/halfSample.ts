import { ImageWrapper } from "quagga";

/**
 * @param inImg {ImageWrapper} input image to be sampled
 * @param outImg {ImageWrapper} to be stored in
 */

export default function halfSample(inImgWrapper: ImageWrapper, outImgWrapper: ImageWrapper) {
    const inImg = inImgWrapper.data;
    const inWidth = inImgWrapper.size.x;
    const outImg = outImgWrapper.data;
    let topRowIdx = 0;
    let bottomRowIdx = inWidth;
    const endIdx = inImg.length;
    const outWidth = inWidth / 2;
    let outImgIdx = 0;
    while (bottomRowIdx < endIdx) {
        for (let i = 0; i < outWidth; i++) {
            outImg[outImgIdx] = Math.floor(
                (inImg[topRowIdx] + inImg[topRowIdx + 1] + inImg[bottomRowIdx] + inImg[bottomRowIdx + 1]) / 4
            );
            outImgIdx++;
            topRowIdx += 2;
            bottomRowIdx += 2;
        }
        topRowIdx += inWidth;
        bottomRowIdx += inWidth;
    }
}
