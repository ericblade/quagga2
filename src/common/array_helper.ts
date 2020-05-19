import { TypedArray } from '../../type-definitions/quagga';

export default {
    init(arr: TypedArray | Array<any>, val: any) {
        arr.fill(val);
    },

    /**
     * Shuffles the content of an array
     */
    shuffle(arr: Array<number>) {
        for (let i = arr.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * i);
            const x = arr[i];
            arr[i] = arr[j];
            arr[j] = x;
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
    threshold(arr: Array<number>, threshold: number, scoreFunc: ((score: number) => number)) {
        const queue = arr.reduce((prev: Array<number>, next) => {
            if (scoreFunc.apply(arr, [next]) >= threshold) {
                prev.push(next);
            }
            return prev;
        }, []);
        return queue;
    },

    maxIndex(arr: Array<any>) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > arr[max]) {
                max = i;
            }
        }
        return max;
    },

    max(arr: Array<any>) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    },

    sum(arr: Array<any> | TypedArray): number {
        let { length } = arr;
        let sum = 0;

        while (length--) {
            sum += arr[length];
        }
        return sum;
    },
};
