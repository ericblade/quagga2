/* eslint-disable no-param-reassign */
import { ImageDataArray } from '../../type-definitions/quagga';

export function init(arr: ImageDataArray, val: number) {
    arr.fill(val);
}

export function maxIndex(arr: ImageDataArray) {
    const max = Math.max(...arr);
    return arr.indexOf(max);
}

export function sum(arr: ImageDataArray): number {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    return (arr as number[]).reduce<number>((pv: number, cv: number) => (pv + cv), 0);
}
