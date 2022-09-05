import computeGray from './computeGray';

export default function loadImageArray(src, callback, canvas = document && document.createElement('canvas')) {
    const img = new Image();
    img.callback = callback;
    img.onload = function () {
        // eslint-disable-next-line no-param-reassign
        canvas.width = this.width;
        // eslint-disable-next-line no-param-reassign
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0);
        const array = new Uint8Array(this.width * this.height);
        ctx.drawImage(this, 0, 0);
        const { data } = ctx.getImageData(0, 0, this.width, this.height);
        computeGray(data, array);
        this.callback(array, {
            x: this.width,
            y: this.height,
        }, this);
    };
    img.src = src;
}
