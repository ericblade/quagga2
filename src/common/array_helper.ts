// TODO: it seems these are intended to be used on Numbers, we should probably see if that's the
// case by switching all the Array<any> to Array<Number> and see what happens.
// TODO: Most all of these functions can be redone with Array#reduce

export default {
    init: function(arr: Array<number>, val: number) {
        arr.fill(val);
    },

    /**
     * Shuffles the content of an array
     */
    shuffle: function(arr: Array<number>) {
        let i = arr.length - 1;
        for (i; i >= 0; i--) {
            const j = Math.floor(Math.random() * i);
            const x = arr[i];
            arr[i] = arr[j];
            arr[j] = x;
        }
        return arr;
    },

    toPointList: function(arr: Array<Array<number>>) {
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
    threshold: function(arr: Array<any>, threshold: number, scoreFunc: ((score: number) => number)) {
        const queue:Array<any> = [];
        for (let i = 0; i < arr.length; i++) {
            if (scoreFunc.apply(arr, [arr[i]]) >= threshold) {
                queue.push(arr[i]);
            }
        }
        return queue;
    },

    maxIndex: function(arr: Array<any>) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > arr[max]) {
                max = i;
            }
        }
        return max;
    },

    max: function(arr: Array<any>) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    },

    sum: function(arr: Array<any>) {
        let length = arr.length;
        let sum = 0;

        while (length--) {
            sum += arr[length];
        }
        return sum;
    },
};
