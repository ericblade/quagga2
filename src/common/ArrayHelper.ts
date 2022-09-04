/* eslint-disable no-param-reassign */
import { TypedArray } from '../../type-definitions/quagga';

export function init(arr: TypedArray | Array<number>, val: number) {
    arr.fill(val);
}

export function maxIndex(arr: Array<number>) {
    let max = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > arr[max]) {
            max = i;
        }
    }
    return max;
}

export function sum(arr: Array<number> | TypedArray): number {
    let { length } = arr;
    let arrSum = 0;

    while (length--) {
        arrSum += arr[length];
    }
    return arrSum;
}
