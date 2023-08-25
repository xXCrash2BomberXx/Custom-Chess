"use strict";

async function Minimax(p1: Array<Piece>, p2: Array<Piece>, steps: number = 3, alpha: number = -Infinity, beta: number = Infinity): Promise<Array<number>> {
    let bestScore = -Infinity;
    let bestMove: Array<number> = [];

    for (const piece of p1) {
        if (piece.x === -1 && piece.y === -1)
            continue;
        const moves = piece.getMoves([...p1, ...p2]);
        for (const j of moves) {
			// @ts-expect-error
            const cloned_p1: Array<Piece> = _.cloneDeep(p1);
			// @ts-expect-error
            const cloned_p2: Array<Piece> = _.cloneDeep(p2);
            cloned_p1[p1.indexOf(piece)].move(j[0] as number, j[1] as number, [...cloned_p1, ...cloned_p2]);
            let score = 0;
            for (const k of cloned_p1)
                if (k.x === -1 && k.y === -1)
                    score -= k.value;
            for (const k of cloned_p2)
                if (k.x === -1 && k.y === -1)
                    score += k.value;
            if (steps > 1)
                score -= (await Minimax(cloned_p2, cloned_p1, steps - 1, -beta, -alpha))[4];
            if (-score > bestScore) {
                bestScore = -score;
                bestMove = [piece.x, piece.y, j[0] as number, j[1] as number, bestScore];
            }
            alpha = Math.max(alpha, bestScore);
            if (alpha >= beta)
                break;
        }
    }
    return bestMove;
}
