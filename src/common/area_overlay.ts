import { QuaggaJSConfigObject, XYSize } from '../../type-definitions/quagga.d';

interface AreaRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Calculates the area rectangle from the area configuration percentages.
 * This converts percentage-based area boundaries to pixel coordinates.
 * 
 * @param canvasSize - The size of the canvas
 * @param area - The area configuration with top, right, bottom, left as percentage strings
 * @returns The calculated rectangle with x, y, width, height
 */
export function calculateAreaRect(
    canvasSize: XYSize,
    area: { top?: string; right?: string; bottom?: string; left?: string },
): AreaRect {
    const canvasWidth = canvasSize.x;
    const canvasHeight = canvasSize.y;

    const top = parseInt(area.top || '0', 10) / 100;
    const right = parseInt(area.right || '0', 10) / 100;
    const bottom = parseInt(area.bottom || '0', 10) / 100;
    const left = parseInt(area.left || '0', 10) / 100;

    const x = canvasWidth * left;
    const y = canvasHeight * top;
    const width = canvasWidth - canvasWidth * right - x;
    const height = canvasHeight - canvasHeight * bottom - y;

    return { x, y, width, height };
}

/**
 * Checks if the area is defined and different from the default (full canvas).
 * 
 * @param area - The area configuration
 * @returns true if area is defined and not the default full canvas
 */
export function isAreaDefined(
    area?: { top?: string; right?: string; bottom?: string; left?: string },
): boolean {
    if (!area) {
        return false;
    }
    // Check if any value is different from 0%
    return (
        (area.top !== undefined && area.top !== '0%')
        || (area.right !== undefined && area.right !== '0%')
        || (area.bottom !== undefined && area.bottom !== '0%')
        || (area.left !== undefined && area.left !== '0%')
    );
}

/**
 * Draws the scan area boundary on the overlay canvas.
 * This visually highlights the region where Quagga is looking for barcodes.
 * 
 * @param ctx - The canvas 2D rendering context (overlay canvas)
 * @param canvasSize - The size of the canvas
 * @param area - The area configuration with top, right, bottom, left as percentage strings
 * @param color - The color of the area border (default: 'rgba(0, 255, 0, 0.5)')
 * @param lineWidth - The width of the border line (default: 2)
 */
export function drawAreaOverlay(
    ctx: CanvasRenderingContext2D,
    canvasSize: XYSize,
    area: { top?: string; right?: string; bottom?: string; left?: string },
    color = 'rgba(0, 255, 0, 0.5)',
    lineWidth = 2,
): void {
    const rect = calculateAreaRect(canvasSize, area);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

/**
 * Draws the area overlay if configured to do so.
 * This is the main function to call from the Quagga processing loop.
 * 
 * @param config - The Quagga configuration object
 * @param ctx - The canvas 2D rendering context (overlay canvas)
 * @param canvasSize - The size of the canvas
 */
export function drawAreaIfConfigured(
    config: QuaggaJSConfigObject | undefined,
    ctx: CanvasRenderingContext2D | null,
    canvasSize: XYSize,
): void {
    if (!config || !ctx) {
        return;
    }

    const inputStream = config.inputStream;
    if (!inputStream) {
        return;
    }

    const { area, debug } = inputStream;

    // Only draw if showArea is enabled and area is defined
    if (!debug?.showArea || !isAreaDefined(area)) {
        return;
    }

    const color = debug.areaColor || 'rgba(0, 255, 0, 0.5)';
    const lineWidth = debug.areaLineWidth || 2;

    drawAreaOverlay(ctx, canvasSize, area!, color, lineWidth);
}
