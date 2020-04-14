import { InputStreamType } from './setupInputStream';

// TODO: need a typescript type for canvasContainer
// TODO: need a typescript type for inputStream

export default function initCanvas(viewport: HTMLElement, canvasContainer: { dom: any, ctx: any }, inputStreamType: InputStreamType, inputStream: any) {
    if (typeof document !== 'undefined') {
        canvasContainer.dom.image = document.querySelector('canvas.imgBuffer');
        if (!canvasContainer.dom.image) {
            canvasContainer.dom.image = document.createElement('canvas');
            canvasContainer.dom.image.className = 'imgBuffer';
            if (viewport && inputStreamType === 'ImageStream') {
                viewport.appendChild(canvasContainer.dom.image);
            }
        }
        canvasContainer.ctx.image = canvasContainer.dom.image.getContext('2d');
        canvasContainer.dom.image.width = inputStream.getCanvasSize().x;
        canvasContainer.dom.image.height = inputStream.getCanvasSize().y;

        canvasContainer.dom.overlay = document.querySelector('canvas.drawingBuffer');
        if (!canvasContainer.dom.overlay) {
            canvasContainer.dom.overlay = document.createElement('canvas');
            canvasContainer.dom.overlay.className = 'drawingBuffer';
            if (viewport) {
                viewport.appendChild(canvasContainer.dom.overlay);
            }
        }
        canvasContainer.ctx.overlay = canvasContainer.dom.overlay.getContext('2d');
        canvasContainer.dom.overlay.width = inputStream.getCanvasSize().x;
        canvasContainer.dom.overlay.height = inputStream.getCanvasSize().y;
    }
}
