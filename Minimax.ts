async function Minimax(p1: Array<Piece>, p2: Array<Piece>, steps: number = 3): Promise<Array<number>> {  // 130^steps
    let scores: Array<Array<number>> = [];
    let score: Promise<number> | number;
    for (let i = 0; i < p1.length; i++)
        if (p1[i].x == -1 && p1[i].y == -1)
            continue;
        else
            for (const j of p1[i].getMoves([...p1, ...p2])) {
                // @ts-expect-error
                let cloned_p1: Array<Piece> = _.cloneDeep(p1);
                // @ts-expect-error
                let cloned_p2: Array<Piece> = _.cloneDeep(p2);
                cloned_p1[i].move(j[0] as number, j[1] as number, [...cloned_p1, ...cloned_p2]);
                if (steps > 1) {
					const move: Array<number> = await Minimax(cloned_p2, cloned_p1, steps - 1);
					Piece.getPiece(move[0], move[1], cloned_p2)?.move(move[2], move[3]);
				}
				score = 0;
				for (const k of cloned_p1)
					if (k.x == -1 && k.y == -1)
						score -= k.value;
				for (const k of cloned_p2)
					if (k.x == -1 && k.y == -1)
						score += k.value;
                scores.push([score, i, j[0] as number, j[1] as number]);
            }
	let best: number = 0;
	for (let i = 1; i < scores.length; i++)
		if (scores[i][0] > scores[best][0])
			best = i;
    return [p1[scores[best][1]].x, p1[scores[best][1]].y, scores[best][2], scores[best][3]];
}
