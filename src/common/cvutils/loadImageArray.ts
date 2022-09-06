import { ImageDimensions } from './calculatePatchSize';
import computeGray from './computeGray';

// not used?
export default function loadImageArray(src: string, callback: (array: Uint8Array, dimensions: ImageDimensions) => void, canvas = document && document.createElement('canvas')) {
    const img = new Image();
    img.onload = function () {
        // eslint-disable-next-line no-param-reassign
        canvas.width = img.width;
        // eslint-disable-next-line no-param-reassign
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            const array = new Uint8Array(img.width * img.height);
            ctx.drawImage(img, 0, 0);
            const { data } = ctx.getImageData(0, 0, img.width, img.height);
            computeGray(data, array);
            callback(array, {
                x: img.width,
                y: img.height,
            });
        }
    };
    img.src = src;
}
