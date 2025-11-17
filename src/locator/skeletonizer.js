/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
/* eslint-disable eqeqeq */
/* @preserve ASM BEGIN */
/**
 * Morphological skeletonization using iterative thinning algorithm.
 * Reduces binary images to single-pixel-wide skeletons while preserving topology.
 *
 * Memory layout in shared ArrayBuffer (4 regions of size²):
 * - Region 0: Working image (subImagePtr = 0)
 * - Region 1: Eroded result (erodedImagePtr = size²)
 * - Region 2: Temp/scratch space (tempImagePtr = 2*size²)
 * - Region 3: Final skeleton output (skelImagePtr = 3*size²)
 */
function Skeletonizer(stdlib, foreign, buffer) {
    'use asm';

    var images = new stdlib.Uint8Array(buffer);
    var size = foreign.size | 0;
    var imul = stdlib.Math.imul;

    /**
     * Morphological erosion with 5-pixel cross structuring element.
     * A pixel survives only if all 5 pixels in the cross pattern are set:
     * top-left, top-right, center, bottom-left, bottom-right.
     */
    function erode(inImagePtr, outImagePtr) {
        inImagePtr = inImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        var v = 0;
        var u = 0;
        var sum = 0;
        var yStart1 = 0;
        var yStart2 = 0;
        var xStart1 = 0;
        var xStart2 = 0;
        var offset = 0;

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
                // Pixel survives erosion only if all 5 cross neighbors are set
                if ((sum | 0) == (5 | 0)) {
                    images[(outImagePtr + offset + u) | 0] = 1;
                } else {
                    images[(outImagePtr + offset + u) | 0] = 0;
                }
            }
        }
    }

    // Pixel-wise subtraction: out = a - b (captures the "peeled" layer)
    function subtract(aImagePtr, bImagePtr, outImagePtr) {
        aImagePtr = aImagePtr | 0;
        bImagePtr = bImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        var length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(outImagePtr + length) | 0] = ((images[(aImagePtr + length) | 0] | 0) - (images[(bImagePtr + length) | 0] | 0)) | 0;
        }
    }

    // Pixel-wise OR: out = a | b (accumulates skeleton layers)
    function bitwiseOr(aImagePtr, bImagePtr, outImagePtr) {
        aImagePtr = aImagePtr | 0;
        bImagePtr = bImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        var length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(outImagePtr + length) | 0] = ((images[(aImagePtr + length) | 0] | 0) | (images[(bImagePtr + length) | 0] | 0)) | 0;
        }
    }

    // Counts non-zero pixels to detect when erosion is complete
    function countNonZero(imagePtr) {
        imagePtr = imagePtr | 0;

        var sum = 0;
        var length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            sum = ((sum | 0) + (images[(imagePtr + length) | 0] | 0)) | 0;
        }

        return (sum | 0);
    }

    // Fills image region with a constant value
    function init(imagePtr, value) {
        imagePtr = imagePtr | 0;
        value = value | 0;

        var length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(imagePtr + length) | 0] = value;
        }
    }

    // Morphological dilation with 5-pixel cross - pixel is set if any neighbor is set
    function dilate(inImagePtr, outImagePtr) {
        inImagePtr = inImagePtr | 0;
        outImagePtr = outImagePtr | 0;

        var v = 0;
        var u = 0;
        var sum = 0;
        var yStart1 = 0;
        var yStart2 = 0;
        var xStart1 = 0;
        var xStart2 = 0;
        var offset = 0;

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

    // Copies image data from src to dst region
    function memcpy(srcImagePtr, dstImagePtr) {
        srcImagePtr = srcImagePtr | 0;
        dstImagePtr = dstImagePtr | 0;

        var length = 0;

        length = imul(size, size) | 0;

        while ((length | 0) > 0) {
            length = (length - 1) | 0;
            images[(dstImagePtr + length) | 0] = (images[(srcImagePtr + length) | 0] | 0);
        }
    }

    /**
     * Zeros out the border pixels of the image.
     * First loop: handles top, left, and right edges simultaneously
     * Second loop: handles bottom edge
     */
    function zeroBorder(imagePtr) {
        imagePtr = imagePtr | 0;

        var x = 0;
        var y = 0;

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

    /**
     * Main skeletonization algorithm using iterative thinning:
     * 1. Erode the working image
     * 2. Dilate the eroded version
     * 3. Subtract dilated from original (extracts "peeled" layer)
     * 4. OR the peeled layer into skeleton accumulator
     * 5. Copy eroded image back to working image
     * 6. Repeat until working image is empty
     *
     * @returns {void} No return value - operates directly on shared buffer.
     *   Input image is read from buffer offset 0 (subImagePtr).
     *   Output skeleton is written to buffer offset 3*size² (skelImagePtr).
     */
    function skeletonize() {
        var subImagePtr = 0;        // Region 0: Working image (input, offset = 0)
        var erodedImagePtr = 0;     // Region 1: Eroded result (offset = size²)
        var tempImagePtr = 0;       // Region 2: Scratch space (offset = 2*size²)
        var skelImagePtr = 0;       // Region 3: Final skeleton (output, offset = 3*size²)
        var sum = 0;
        var done = 0;

        // Calculate byte offsets for each region in the shared buffer
        erodedImagePtr = imul(size, size) | 0;                  // Region 1: size² bytes in
        tempImagePtr = (erodedImagePtr + erodedImagePtr) | 0;  // Region 2: 2*size² bytes in
        skelImagePtr = (tempImagePtr + erodedImagePtr) | 0;    // Region 3: 3*size² bytes in

        // Initialize skeleton accumulator to zero
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
    return { skeletonize: skeletonize };
}
/* @preserve ASM END */

export default Skeletonizer;
/* eslint-enable eqeqeq */
