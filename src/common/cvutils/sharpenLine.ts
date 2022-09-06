import { ImageDataArray } from "../../../type-definitions/quagga";

// TODO: not used?
export default function sharpenLine(line: ImageDataArray) {
    let i;
    const { length } = line;
    let left = line[0];
    let center = line[1];
    let right;

    for (i = 1; i < length - 1; i++) {
        right = line[i + 1];
        //  -1 4 -1 kernel
        // eslint-disable-next-line no-param-reassign, no-bitwise
        line[i - 1] = (((center * 2) - left - right)) & 255;
        left = center;
        center = right;
    }
    return line;
}
