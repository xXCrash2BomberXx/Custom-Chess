// p1: array[Piece, ...], p2: array[Piece, ...], steps: int = 5, top: boolean = true -> [int, int, int, int]
async function Minimax(p1, p2, steps = 3, top = true) {  // 129^steps
    if (steps <= 0)
        console.error('Cannot calculate less than or equal to 0 moves in advance');
    let scores = [];
    let score;
    for (let i = 0; i < p1.length; i++)
        for (const j of p1[i].getMoves([...p1, ...p2])) {
            let cloned_p1 = _.cloneDeep(p1);
            let cloned_p2 = _.cloneDeep(p2);
            if (!cloned_p1[i].move(j[0], j[1], [...cloned_p1, ...cloned_p2]))
                console.log('Invalid Piece Movement Attempted');
            if (steps > 1)
                score = Minimax(cloned_p2, cloned_p1, steps-1, false);
            else {
                score = 0;
                for (const k of cloned_p1)
                    if (k.x == -1 && k.y == -1)
                        score -= k.value;
                for (const k of cloned_p2)
                    if (k.x == -1 && k.y == -1)
                        score += k.value;
            }
            scores.push([score, i, j[0], j[1]]);
        }
    let best = 0;
    for await (const score of scores)
        score[0] = await score[0];
    for (let i = 1; i < scores.length; i++)
        if (scores[i][0] > scores[best][0])
            best = i;
    if (top)
        return [p1[scores[best][1]].x, p1[scores[best][1]].y, scores[best][2], scores[best][3]];
    else
        return scores[best][0];
}
