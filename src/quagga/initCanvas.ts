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
    if (typeof ENV !== 'undefined' && ENV.development && options.debug?.showImageDetails) {
        console.warn('* initCanvas getCanvasAndContext');
    }
    const context = canvas.getContext('2d', { willReadFrequently: options.willReadFrequently });
    return { canvas, context };
}

interface InitCanvasesOptions {
    willReadFrequently: boolean;
    willCreateOverlay: boolean;
    debug?: any;
}

function initCanvases(canvasSize: XYSize, { willReadFrequently, willCreateOverlay, debug }: InitCanvasesOptions): CanvasContainer | null {
    if (typeof document !== 'undefined') {
        const image = getCanvasAndContext('canvas.imgBuffer', 'imgBuffer', { willReadFrequently, debug });
        image.canvas.width = canvasSize.x;
        image.canvas.height = canvasSize.y;

        // Only create overlay canvas if willCreateOverlay is true (default behavior)
        let overlay: { canvas: HTMLCanvasElement | null; context: CanvasRenderingContext2D | null } = {
            canvas: null,
            context: null,
        };
        if (willCreateOverlay) {
            overlay = getCanvasAndContext('canvas.drawingBuffer', 'drawingBuffer', { willReadFrequently, debug });
            overlay.canvas!.width = canvasSize.x;
            overlay.canvas!.height = canvasSize.y;
        }

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

    // Default to true for backwards compatibility
    const willCreateOverlay = context?.config?.canvas?.willCreateOverlay !== false;

    const container = initCanvases(
        context.inputStream.getCanvasSize(),
        {
            willReadFrequently: !!context?.config?.inputStream?.willReadFrequently,
            willCreateOverlay,
            debug: context?.config?.locator?.debug
        }
    );
    if (!container) return { dom: { image: null, overlay: null }, ctx: { image: null, overlay: null } };

    const { dom } = container;
    if (typeof document !== 'undefined') {
        if (viewport) {
            if (type === 'ImageStream' && dom.image && !viewport.contains(dom.image)) {
                viewport.appendChild(dom.image);
            }
            if (dom.overlay && !viewport.contains(dom.overlay)) {
                viewport.appendChild(dom.overlay);
            }
        }
    }
    return container;
}
