import { XYSize } from '../../type-definitions/quagga';
import { QuaggaContext } from 'QuaggaContext';
import getViewPort from './getViewPort';

function findOrCreateCanvas(selector: string, className: string) {
    let canvas: HTMLCanvasElement | null = document.querySelector(selector);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = className;
    }
    return canvas;
}

function getCanvasAndContext(selector: string, className: string) {
    const canvas = findOrCreateCanvas(selector, className);
    const context = canvas.getContext('2d');
    return { canvas, context };
}

export default function initCanvas(canvasSize: XYSize) {
    if (typeof document !== 'undefined') {
        const image = getCanvasAndContext('canvas.imgBuffer', 'imgBuffer');
        const overlay = getCanvasAndContext('canvas.drawingBuffer', 'drawingBuffer');

        image.canvas.width = overlay.canvas.width = canvasSize.x;
        image.canvas.height = overlay.canvas.height = canvasSize.y;

        return {
            dom: {
                image: image.canvas,
                overlay: overlay.canvas,
            },
            ctx: {
                image: image.context,
                overlay: overlay.context,
            }
        }
    }
    return null;
}
