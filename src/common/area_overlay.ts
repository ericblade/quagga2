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
 * Checks if area visualization should be drawn based on borderColor or borderWidth being defined.
 * 
 * @param area - The area configuration
 * @returns true if visualization should be drawn (borderColor is defined or borderWidth > 0)
 */
export function shouldDrawAreaOverlay(
    area?: { borderColor?: string; borderWidth?: number; backgroundColor?: string },
): boolean {
    if (!area) {
        return false;
    }
    return (
        (area.borderColor !== undefined && area.borderColor !== '')
        || (area.borderWidth !== undefined && area.borderWidth > 0)
        || (area.backgroundColor !== undefined && area.backgroundColor !== '')
    );
}

/**
 * Draws the scan area boundary on the overlay canvas.
 * This visually highlights the region where Quagga is looking for barcodes.
 * 
 * @param ctx - The canvas 2D rendering context (overlay canvas)
 * @param canvasSize - The size of the canvas
 * @param area - The area configuration with top, right, bottom, left as percentage strings
 * @param borderColor - The color of the area border (default: 'rgba(0, 255, 0, 0.5)')
 * @param borderWidth - The width of the border line (default: 2)
 * @param backgroundColor - The background color to fill the area (optional)
 */
export function drawAreaOverlay(
    ctx: CanvasRenderingContext2D,
    canvasSize: XYSize,
    area: { top?: string; right?: string; bottom?: string; left?: string },
    borderColor = 'rgba(0, 255, 0, 0.5)',
    borderWidth = 2,
    backgroundColor?: string,
): void {
    const rect = calculateAreaRect(canvasSize, area);

    // Draw background fill if specified
    if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    // Draw border if borderWidth > 0
    if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
}

/**
 * Draws the area overlay if configured to do so.
 * This is the main function to call from the Quagga processing loop.
 * Drawing is triggered when area.borderColor or area.borderWidth is defined.
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

    const { area } = inputStream;

    // Only draw if area visualization is configured and area is actually defined
    if (!area || !shouldDrawAreaOverlay(area) || !isAreaDefined(area)) {
        return;
    }

    const shouldDrawBorder = area.borderColor !== undefined || area.borderWidth !== undefined;
    const borderColor = area.borderColor ?? 'rgba(0, 255, 0, 0.5)';
    const borderWidth = shouldDrawBorder ? (area.borderWidth ?? 2) : 0;
    const backgroundColor = area.backgroundColor;

    drawAreaOverlay(ctx, canvasSize, area, borderColor, borderWidth, backgroundColor);
}
