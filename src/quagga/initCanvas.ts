import { QuaggaContext, CanvasContainer } from 'QuaggaContext';
import getViewPort from './getViewPort';
import type { XYSize } from '../../type-definitions/quagga.d';

function findOrCreateCanvas(selector: string, className: string) {
    let canvas: HTMLCanvasElement | null = document.querySelector(selector);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = className;
    }
    return canvas;
}

function getCanvasAndContext(selector: string, className: string, options: { willReadFrequently: boolean; debug?: any }) {
    const canvas = findOrCreateCanvas(selector, className);
    if (ENV.development && options.debug?.showImageDetails) {
        console.warn('* initCanvas getCanvasAndContext');
    }
    const context = canvas.getContext('2d', { willReadFrequently: options.willReadFrequently });
    return { canvas, context };
}

function initCanvases(canvasSize: XYSize, { willReadFrequently, debug }: { willReadFrequently: boolean; debug?: any }): CanvasContainer | null {
    if (typeof document !== 'undefined') {
        const image = getCanvasAndContext('canvas.imgBuffer', 'imgBuffer', { willReadFrequently, debug });
        const overlay = getCanvasAndContext('canvas.drawingBuffer', 'drawingBuffer', { willReadFrequently, debug });

        // eslint-disable-next-line no-multi-assign
        image.canvas.width = overlay.canvas.width = canvasSize.x;
        // eslint-disable-next-line no-multi-assign
        image.canvas.height = overlay.canvas.height = canvasSize.y;

        return {
            dom: {
                image: image.canvas,
                overlay: overlay.canvas,
            },
            ctx: {
                image: image.context,
                overlay: overlay.context,
            },
        };
    }
    return null;
}

export default function initCanvas(context: QuaggaContext): CanvasContainer | null {
    const viewport = getViewPort(context?.config?.inputStream?.target);
    const type = context?.config?.inputStream?.type;
    if (!type) return null;
    const container = initCanvases(
        context.inputStream.getCanvasSize(), 
        { 
            willReadFrequently: !!context?.config?.inputStream?.willReadFrequently,
            debug: context?.config?.locator?.debug 
        }
    );
    if (!container) return { dom: { image: null, overlay: null }, ctx: { image: null, overlay: null } };

    const { dom } = container;
    if (typeof document !== 'undefined') {
        if (viewport) {
            if (type === 'ImageStream' && !viewport.contains(dom.image)) {
                viewport.appendChild(dom.image);
            }
            if (!viewport.contains(dom.overlay)) {
                viewport.appendChild(dom.overlay);
            }
        }
    }
    return container;
}
