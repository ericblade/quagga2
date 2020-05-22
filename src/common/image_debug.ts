import { XYSize } from '../../type-definitions/quagga.d';

declare interface XYPosition {
    x: number;
    y: number;
}

declare interface CanvasStyle {
    color: string;
    lineWidth: number;
}

// XYDefinition tells us which component of a given array or object is the "X" and which is the "Y".
// Usually this is 0 for X and 1 for Y, but might be used as 'x' for x and 'y' for Y.
declare interface XYDefinition {
    x: keyof XYPosition;
    y: keyof XYPosition;
}

declare type Path = Array<XYPosition>;

export default {
    drawRect(pos: XYPosition, size: XYSize, ctx: CanvasRenderingContext2D, style: CanvasStyle): void {
        ctx.strokeStyle = style.color;
        ctx.fillStyle = style.color;
        ctx.lineWidth = style.lineWidth || 1;
        ctx.beginPath();
        ctx.strokeRect(pos.x, pos.y, size.x, size.y);
    },
    drawPath(path: Path, def: XYDefinition, ctx: CanvasRenderingContext2D, style: CanvasStyle): void {
        ctx.strokeStyle = style.color;
        ctx.fillStyle = style.color;
        ctx.lineWidth = style.lineWidth;
        ctx.beginPath();
        ctx.moveTo(path[0][def.x], path[0][def.y]);
        for (let j = 1; j < path.length; j++) {
            ctx.lineTo(path[j][def.x], path[j][def.y]);
        }
        ctx.closePath();
        ctx.stroke();
    },
    drawImage(imageData: Array<number>, size: XYSize, ctx: CanvasRenderingContext2D): boolean {
        const canvasData = ctx.getImageData(0, 0, size.x, size.y);
        const { data } = canvasData;
        let canvasDataPos = data.length;
        let imageDataPos = imageData.length;

        if (canvasDataPos / imageDataPos !== 4) {
            return false;
        }
        while (imageDataPos--) {
            const value = imageData[imageDataPos];
            data[--canvasDataPos] = 255;
            data[--canvasDataPos] = value;
            data[--canvasDataPos] = value;
            data[--canvasDataPos] = value;
        }
        ctx.putImageData(canvasData, 0, 0);
        return true;
    },
};
