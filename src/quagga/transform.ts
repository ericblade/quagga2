/* eslint-disable no-param-reassign */
import { XYObject } from '../../type-definitions/quagga.d';

export type Box = Array<[ number, number ]>;
type Point = XYObject<'Point'>;

export type Line = [ Point, Point ];

export function moveBox(box: Box, xOffset: number, yOffset: number): void {
    let corner = box.length;
    while (corner--) {
        box[corner][0] += xOffset;
        box[corner][1] += yOffset;
    }
}

export function moveLine(line: Line, xOffset: number, yOffset: number): void {
    line[0].x += xOffset;
    line[0].y += yOffset;
    line[1].x += xOffset;
    line[1].y += yOffset;
}
