/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
/* eslint-disable eqeqeq */

/* @preserve ASM BEGIN */
function Skeletonizer(stdlib, foreign, buffer) {
    'use asm';

    const images = new stdlib.Uint8Array(buffer);
    const size = foreign.size | 0;
    const imul = stdlib.Math.imul;

    function erode(inImagePtr, outImagePtr) {
        inImagePtr = inImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        var v = 0,
            u = 0,
            sum = 0,
            yStart1 = 0,
            yStart2 = 0,
            xStart1 = 0,
            xStart2 = 0,
            offset = 0;

        for (v = 1; (v | 0) < ((size - 1) | 0); v = (v + 1) | 0) {
            offset = (offset + size) | 0;
            for (u = 1; (u | 0) < ((size - 1) | 0); u = (u + 1) | 0) {
                yStart1 = (offset - size) | 0;
                yStart2 = (offset + size) | 0;
                xStart1 = (u - 1) | 0;
                xStart2 = (u + 1) | 0;
                sum = ((images[(inImagePtr + yStart1 + xStart1) | 0] | 0)
                    + (images[(inImagePtr + yStart1 + xStart2) | 0] | 0)
                    + (images[(inImagePtr + offset + u) | 0] | 0)
                    + (images[(inImagePtr + yStart2 + xStart1) | 0] | 0)
                    + (images[(inImagePtr + yStart2 + xStart2) | 0] | 0)) | 0;
                if ((sum | 0) == (5 | 0)) {
                    images[(outImagePtr + offset + u) | 0] = 1;
                } else {
                    images[(outImagePtr + offset + u) | 0] = 0;
                }
            }
        }
        return;
    }

    function subtract(aImagePtr, bImagePtr, outImagePtr) {
        aImagePtr = aImagePtr | 0;
        bImagePtr = bImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        let length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(outImagePtr + length) | 0] = ((images[(aImagePtr + length) | 0] | 0) - (images[(bImagePtr + length) | 0] | 0)) | 0;
        }
    }

    function bitwiseOr(aImagePtr, bImagePtr, outImagePtr) {
        aImagePtr = aImagePtr | 0;
        bImagePtr = bImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        let length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(outImagePtr + length) | 0] = ((images[(aImagePtr + length) | 0] | 0) | (images[(bImagePtr + length) | 0] | 0)) | 0;
        }
    }

    function countNonZero(imagePtr) {
        imagePtr = imagePtr | 0;

        let sum = 0;
        let length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            sum = ((sum | 0) + (images[(imagePtr + length) | 0] | 0)) | 0;
        }

        return (sum | 0);
    }

    function init(imagePtr, value) {
        imagePtr = imagePtr | 0;
        value = value | 0;

        let length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(imagePtr + length) | 0] = value;
        }
    }

    function dilate(inImagePtr, outImagePtr) {
        inImagePtr = inImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        let v = 0;
        let u = 0;
        let sum = 0;
        let yStart1 = 0;
        let yStart2 = 0;
        let xStart1 = 0;
        let xStart2 = 0;
        let offset = 0;

        for (v = 1; (v | 0) < ((size - 1) | 0); v = (v + 1) | 0) {
            offset = (offset + size) | 0;
            for (u = 1; (u | 0) < ((size - 1) | 0); u = (u + 1) | 0) {
                yStart1 = (offset - size) | 0;
                yStart2 = (offset + size) | 0;
                xStart1 = (u - 1) | 0;
                xStart2 = (u + 1) | 0;
                sum = ((images[(inImagePtr + yStart1 + xStart1) | 0] | 0)
                    + (images[(inImagePtr + yStart1 + xStart2) | 0] | 0)
                    + (images[(inImagePtr + offset + u) | 0] | 0)
                    + (images[(inImagePtr + yStart2 + xStart1) | 0] | 0)
                    + (images[(inImagePtr + yStart2 + xStart2) | 0] | 0)) | 0;
                if ((sum | 0) > (0 | 0)) {
                    images[(outImagePtr + offset + u) | 0] = 1;
                } else {
                    images[(outImagePtr + offset + u) | 0] = 0;
                }
            }
        }
    }

    function memcpy(srcImagePtr, dstImagePtr) {
        srcImagePtr = srcImagePtr | 0;
        dstImagePtr = dstImagePtr | 0;

        let length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(dstImagePtr + length) | 0] = (images[(srcImagePtr + length) | 0] | 0);
        }
    }

    function zeroBorder(imagePtr) {
        imagePtr = imagePtr | 0;

        let x = 0;
        let y = 0;

        for (x = 0; (x | 0) < ((size - 1) | 0); x = (x + 1) | 0) {
            images[(imagePtr + x) | 0] = 0;
            images[(imagePtr + y) | 0] = 0;
            y = ((y + size) - 1) | 0;
            images[(imagePtr + y) | 0] = 0;
            y = (y + 1) | 0;
        }
        for (x = 0; (x | 0) < (size | 0); x = (x + 1) | 0) {
            images[(imagePtr + y) | 0] = 0;
            y = (y + 1) | 0;
        }
    }

    function skeletonize() {
        const subImagePtr = 0;
        let erodedImagePtr = 0;
        let tempImagePtr = 0;
        let skelImagePtr = 0;
        let sum = 0;
        let done = 0;

        erodedImagePtr = imul(size, size) | 0;
        tempImagePtr = (erodedImagePtr + erodedImagePtr) | 0;
        skelImagePtr = (tempImagePtr + erodedImagePtr) | 0;

        // init skel-image
        init(skelImagePtr, 0);
        zeroBorder(subImagePtr);

        do {
            erode(subImagePtr, erodedImagePtr);
            dilate(erodedImagePtr, tempImagePtr);
            subtract(subImagePtr, tempImagePtr, tempImagePtr);
            bitwiseOr(skelImagePtr, tempImagePtr, skelImagePtr);
            memcpy(erodedImagePtr, subImagePtr);
            sum = countNonZero(subImagePtr) | 0;
            done = ((sum | 0) == 0 | 0);
        } while (!done);
    }
    return {
        skeletonize: skeletonize
    };
}
/* @preserve ASM END */
module.exports = Skeletonizer;
/* eslint-enable eqeqeq */
