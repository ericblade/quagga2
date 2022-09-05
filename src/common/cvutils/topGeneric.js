export default function topGeneric(list, top, scoreFunc) {
    let i; let minIdx = 0; let min = 0; const queue = []; let score; let hit; let
        pos;

    for (i = 0; i < top; i++) {
        queue[i] = {
            score: 0,
            item: null,
        };
    }

    for (i = 0; i < list.length; i++) {
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
