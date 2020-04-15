type Box = Array<Array<number>>;
interface Point {
    x: number,
    y: number,
};

type Line = [ Point, Point ];

export function moveBox(box: Box, xOffset: number, yOffset: number) {
    let corner = box.length;
    while (corner--) {
        box[corner][0] += xOffset;
        box[corner][1] += yOffset;
    }
}

export function moveLine(line: Line, xOffset: number, yOffset: number) {
    line[0].x += xOffset;
    line[0].y += yOffset;
    line[1].x += xOffset;
    line[1].y += yOffset;
}
