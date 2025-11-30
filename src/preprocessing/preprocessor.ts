import ImageWrapper from '../common/image_wrapper';

/**
 * A preprocessor function that transforms image data in place.
 * Preprocessors are applied to the image data after frame grabbing
 * but before barcode localization and decoding.
 * 
 * IMPORTANT: Preprocessors should:
 * - Modify the imageWrapper.data array IN PLACE for best performance
 * - Maintain the same image dimensions (do not resize)
 * - Return the same imageWrapper instance that was passed in
 * 
 * Modifying in place avoids unnecessary memory allocations and copies,
 * which is critical for real-time video processing performance.
 * 
 * @param imageWrapper The image wrapper to process (modify in place)
 * @returns The same imageWrapper instance (for chaining)
 */
export type QuaggaImagePreprocessor = (imageWrapper: ImageWrapper) => ImageWrapper;

/**
 * Built-in preprocessor: Adds a white border around the image.
 * This is useful for barcodes that lack sufficient quiet zone (whitespace)
 * around them. When a barcode is generated or cropped without proper margins,
 * the decoder may fail to detect it. Adding a border simulates the whitespace
 * that would naturally exist when displaying the barcode on paper or screen.
 * 
 * The image is shrunk slightly and centered, with white border pixels added
 * around it. The output size remains the same as the input size.
 * 
 * @param borderSize Number of pixels of white border to add on each side
 * @returns A preprocessor function that adds the border
 * 
 * @example
 * // Add 10 pixels of white border around all images
 * config.preprocessing = [Quagga.Preprocessors.addBorder(10)];
 */
export function addBorder(borderSize: number): QuaggaImagePreprocessor {
    return (imageWrapper: ImageWrapper): ImageWrapper => {
        if (borderSize <= 0) {
            return imageWrapper;
        }

        const width = imageWrapper.size.x;
        const height = imageWrapper.size.y;

        // Calculate the inner image area (shrunk to make room for border)
        const innerWidth = width - (borderSize * 2);
        const innerHeight = height - (borderSize * 2);

        // If border is too large for the image, just fill with white
        if (innerWidth <= 0 || innerHeight <= 0) {
            for (let i = 0; i < imageWrapper.data.length; i++) {
                imageWrapper.data[i] = 255;
            }
            return imageWrapper;
        }

        // Calculate scale factors for shrinking
        const scaleX = innerWidth / width;
        const scaleY = innerHeight / height;

        // Create a temporary copy of the original data
        // Note: We need to handle both TypedArray and Array<number> types
        const originalData = imageWrapper.data instanceof Uint8Array
            ? new Uint8Array(imageWrapper.data)
            : new Uint8Array(imageWrapper.data);

        // Fill the entire image with white first
        if (imageWrapper.data instanceof Uint8Array) {
            imageWrapper.data.fill(255);
        } else {
            for (let i = 0; i < imageWrapper.data.length; i++) {
                imageWrapper.data[i] = 255;
            }
        }

        // Copy the shrunk image into the center using bilinear interpolation
        for (let y = 0; y < innerHeight; y++) {
            for (let x = 0; x < innerWidth; x++) {
                // Map destination coordinates to source coordinates
                const srcX = x / scaleX;
                const srcY = y / scaleY;

                // Bilinear interpolation
                const x0 = Math.floor(srcX);
                const y0 = Math.floor(srcY);
                const x1 = Math.min(x0 + 1, width - 1);
                const y1 = Math.min(y0 + 1, height - 1);

                const fx = srcX - x0;
                const fy = srcY - y0;

                const v00 = originalData[y0 * width + x0];
                const v10 = originalData[y0 * width + x1];
                const v01 = originalData[y1 * width + x0];
                const v11 = originalData[y1 * width + x1];

                const v0 = v00 * (1 - fx) + v10 * fx;
                const v1 = v01 * (1 - fx) + v11 * fx;
                const value = Math.round(v0 * (1 - fy) + v1 * fy);

                // Write to destination with border offset
                const destIdx = (y + borderSize) * width + (x + borderSize);
                imageWrapper.data[destIdx] = value;
            }
        }

        return imageWrapper;
    };
}

/**
 * Applies a chain of preprocessor functions to an image wrapper.
 * Each preprocessor modifies the image data in place.
 * @param imageWrapper The image wrapper to process
 * @param preprocessors Array of preprocessor functions to apply in order
 * @returns The same imageWrapper instance (modified in place)
 */
export function applyPreprocessors(
    imageWrapper: ImageWrapper,
    preprocessors: QuaggaImagePreprocessor[],
): ImageWrapper {
    let result = imageWrapper;
    for (const preprocessor of preprocessors) {
        result = preprocessor(result);
    }
    return result;
}

/**
 * Collection of built-in preprocessor factories.
 * Users can use these or provide their own QuaggaImagePreprocessor implementations.
 */
export const Preprocessors = {
    addBorder,
};
