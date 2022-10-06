interface QueueItem<T> {
    item: null | T
    score: number,
}

export default function topGeneric<T>(this: any, list: ArrayLike<T>, top: number, scoreFunc: (x: T) => number) {
    let minIdx = 0;
    let min = 0;
    let score;
    let hit;
    let pos;

    const queue = new Array<QueueItem<T>>(top);
    queue.fill({ score: 0, item: null });

    for (let i = 0; i < list.length; i++) {
        score = scoreFunc.apply(this, [list[i]]);
        if (score > min) {
            hit = queue[minIdx];
            hit.score = score;
            hit.item = list[i];
            min = Number.MAX_VALUE;
            for (pos = 0; pos < top; pos++) {
                if (queue[pos].score < min) {
                    min = queue[pos].score;
                    minIdx = pos;
                }
            }
        }
    }

    return queue;
}
