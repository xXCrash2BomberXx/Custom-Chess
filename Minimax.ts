"use strict";

async function Minimax(p1: Array<Piece>, p2: Array<Piece>, steps: number = 3): Promise<Array<number>> {  // 130^steps
	let best: Array<number> = [];
	let bestScore: number = -Infinity;
	for (const piece of p1)
		if (piece.x != -1 || piece.y != -1)
			for (const move of piece.getMoves([...p1, ...p2])) {
				// @ts-expect-error
				let cloned_p1: Array<Piece> = _.cloneDeep(p1);
				// @ts-expect-error
				let cloned_p2: Array<Piece> = _.cloneDeep(p2);
				cloned_p1[p1.indexOf(piece)].move(move[0] as number, move[1] as number, [...cloned_p1, ...cloned_p2]);
				if (steps > 1) {
					const move: Array<number> = await Minimax(cloned_p2, cloned_p1, steps - 1);
					Piece.getPiece(move[0], move[1], cloned_p2)?.move(move[2], move[3]);
				}
				let score: number = 0;
				cloned_p1.forEach(k => {
					if (k.x == -1 && k.y == -1)
						score -= k.value;
				});
				cloned_p2.forEach(k => {
					if (k.x == -1 && k.y == -1)
						score += k.value;
				});
				if (score >= bestScore) {
					bestScore = score;
					best = [piece.x, piece.y, move[0] as number, move[1] as number];
				}
			}
	return best;
}
