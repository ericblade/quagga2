/* eslint-disable no-param-reassign */
import { TypedArray } from '../../type-definitions/quagga';

export default {
    init(arr: TypedArray | Array<number>, val: number) {
        arr.fill(val);
    },

    /**
     * IN-PLACE Shuffles the content of an array
     */
    shuffle(arr: Array<number>) {
        // Durstenfeld shuffle algorithm
        // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    toPointList(arr: Array<Array<number>>) {
        const rows = arr.reduce((p, n) => {
            const row = `[${n.join(',')}]`;
            p.push(row);
            return p;
        }, [] as Array<string>);
        return `[${rows.join(',\r\n')}]`;
    },

    /**
     * returns the elements which's score is bigger than the threshold
     */
    // eslint-disable-next-line no-unused-vars
    threshold(arr: Array<number>, threshold: number, scoreFunc: ((score: number) => number)) {
        const queue = arr.reduce((prev: Array<number>, next) => {
            if (scoreFunc.apply(arr, [next]) >= threshold) {
                prev.push(next);
            }
            return prev;
        }, []);
        return queue;
    },

    maxIndex(arr: Array<number>) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > arr[max]) {
                max = i;
            }
        }
        return max;
    },

    max(arr: Array<number>) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    },

    sum(arr: Array<number> | TypedArray): number {
        let { length } = arr;
        let sum = 0;

        while (length--) {
            sum += arr[length];
        }
        return sum;
    },
};
