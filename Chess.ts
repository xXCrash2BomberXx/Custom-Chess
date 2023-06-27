"use strict";

interface ExtraData {
	PawnPromotion?: string
}

function range(start: number, end: number | undefined = undefined, step: number = 1): Array<number> {
	if (end === undefined) {
		end = start;
		start = 0;
	}
	let arr: Array<number> = [];
	for (let i = start; i < end; i += step)
		arr.push(i);
	return arr;
}


/**
 * https://en.m.wikipedia.org/wiki/Fairy_chess_piece#0%E2%80%939
 *
 * Recommended Order:
 * * \<conditions> \<move type> \<distance> \<direction> \<other>
 *
 * Move Commands:
 * * '1', '2', '3', ..., 'n'/'N' = Distance of N
 * * 'X-Y' = Distance in Inclusive Range from X to Y
 * * '*' = Orthogonal of Diagonal Movement
 * * '+' = Orthogonal Movement
 * * '>' = Forwards Movement
 * * '<' = Backwards Movement
 * * '<>' = Forwards or Backwards Movement
 * * '=' = Orthogonally Sideways Movement
 * * '>=' = Orthogonally Forwards or Sideways Movement
 * * '<=' = Orthogonally Backwards or Sideways Movement
 * * 'x'/'X' = Diagonal Movement
 * * 'x>'/'X>' = Diagonally Forward Movement
 * * 'x<'/'X<' = Diagonally Backward Movement
 * * '+>' = Orthogonally Forward Movement
 * * '+<' = Orthogonally Backward Movement
 * * 'X/Y' = Distance of X and Y in Different Orthogonal Directions
 * * 'W-X/Y-Z' = Distance in Inclusive Range from W to X and Y to Z in Different Orthogonal Directions
 * * 'X/Ys'/'X/YS' = Strict Distance of X Horizontally and then Y Vertically in Different Orthogonal Directions
 * * 'W-X/Y-Zs'/'W-X/Y-ZS' = Strict Distance in Inclusive Range from W to X Horizontally and then Y to Z Vertically in Different Orthogonal Directions
 * * '~' = Jumping Operator (Knights)
* * 'i'/'I' = Only Use on First Movement of Piece
 * * 'c'/'C' = Only Use on Capturing Piece (Only applies to final square being landed on)
 * * 'o'/'O' = Only Use on Not Capturing Piece
 * * ',' = Add Different Movements to a Piece
 * * '-' = Inclusive Range Operator
 * * 'r'/'R' = Right (Relative to Direction 1)
 * * 'l'/'L' = Left (Relative to Direction 1)
 * * 'd'/'D' = Cannot be Killed nor Moved
 * * '()' = Grouping Operator (Nightriders) (Use 'n()' instead of the deprecated '&' operator)
 * * '.' = Then Operator (Aanca)
 * * '^' = Locust Operator (Checkers) (Must capture between each jump)
 * * 'k'/'K' = King flag that enables notifications when placed into check by another piece
 */

class Piece {
	name: string;
	x: number;
	y: number;
	enPassant: boolean;
	moves: string;
	direction: number;
	color: string;
	turns: number;
	xLim: number;
	yLim: number;
	lxLim: number;
	lyLim: number;
	fontFamily: string;
	value: number;
	// Rider (n())
	static #rider(move: string, x1: number, y1: number, x2: number, y2: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0): Array<Array<number>> | boolean {
		while ((move.match(/\(/g) || []).length > (move.match(/\)/g) || []).length)
			move += ")";
		while ((move.match(/\(/g) || []).length < (move.match(/\)/g) || []).length)
			move = "(" + move;
		let factor: string = move.slice(0, move.indexOf("("));
		if (!(factor.match(/[0-9]+$/) || factor.match(/[nN]$/)))
			factor = factor + "1";
		let pattern: string = move.slice(move.indexOf("(") + 1, move.lastIndexOf(")"));
		if (factor.match(/[0-9]+$/)) {
			if (Math.abs(x2 - x1) % parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]) == 0 && Math.abs(y2 - y1) % parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]) == 0) {
				let temp: Array<Array<number>> = [];
				for (let i = 0; i < parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]); i++) {
					if (pattern.includes("(") && pattern.includes(".")) {
						let temp2: Array<Array<number>> | boolean = false;
						for (let t = 0; t < pattern.length; t++)
							if (pattern[t] == "." && (pattern.slice(0, t).match(/\(/g) || []).length == (pattern.slice(0, t).match(/\)/g) || []).length) {
								temp2 = Piece.#then(factor.slice(0, (factor.match(/[0-9]+$/) as RegExpMatchArray).index) +
									pattern.slice(0, t) + "." +
									factor.slice(0, factor.match(/[0-9]+$/) as unknown as number) + pattern.slice(t + 1),
									x1 + i * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + i * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
									x1 + (i + 1) * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + (i + 1) * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
									direction, turns, xLim, yLim, lxLim, lyLim);
								break;
							} else if (t == pattern.length - 1) {
								temp2 = Piece.#rider(factor.slice(0, (factor.match(/[0-9]+$/) as RegExpMatchArray).index) + pattern,
									x1 + i * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + i * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
									x1 + (i + 1) * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + (i + 1) * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
									direction, turns, xLim, yLim, lxLim, lyLim);
							}
						if (temp2)
							temp.push(...temp2 as Array<Array<number>>);
						else
							return false;
					} else if (pattern.includes("(")) {
						let temp2: Array<Array<number>> | boolean = Piece.#rider(factor.slice(0, (factor.match(/[0-9]+$/) as RegExpMatchArray).index) + pattern,
							x1 + i * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + i * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
							x1 + (i + 1) * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + (i + 1) * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
							direction, turns, xLim, yLim, lxLim, lyLim);
						if (temp2)
							temp.push(...temp2 as Array<Array<number>>);
						else
							return false;
					} else if (move.includes(".")) {
						let temp2: Array<Array<number>> | boolean = Piece.#then(factor.slice(0, (factor.match(/[0-9]+$/) as RegExpMatchArray).index) +
							pattern.slice(0, pattern.indexOf(".")) + "." +
							factor.slice(0, (factor.match(/[0-9]+$/) as RegExpMatchArray).index) + pattern.slice(pattern.indexOf(".") + 1),
							x1 + i * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + i * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
							x1 + (i + 1) * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + (i + 1) * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
							direction, turns, xLim, yLim, lxLim, lyLim);
						if (temp2)
							temp.push(...temp2 as Array<Array<number>>);
						else
							return false;
					} else if (Piece.#move(factor.slice(0, (factor.match(/[0-9]+$/) as RegExpMatchArray).index) + pattern,
						x1 + i * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + i * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
						x1 + (i + 1) * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + (i + 1) * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]),
						direction, turns, xLim, yLim, lxLim, lyLim))
						temp.push([x1 + (i + 1) * (x2 - x1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0]), y1 + (i + 1) * (y2 - y1) / parseInt((factor.match(/[0-9]+$/g) as Array<string>)[0])]);
					else
						return false;
				}
				return temp;
			}
		} else if (factor.match(/[nN]$/)) {
			let temp: Array<Array<number>> | boolean = false;
			for (let i = 1; i < Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); i++) {
				temp = Piece.#rider(factor.slice(0, (factor.match(/[nN]$/) as RegExpMatchArray).index) + String(i) + move.slice(move.indexOf("("), move.indexOf(")") + 1),
					x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
				if (temp)
					return temp;
			}
			return false;
		}
		return false;
	}

	// Then (.)
	static #then(move: string, x1: number, y1: number, x3: number, y3: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0): Array<Array<number>> | boolean {
		let p1: string = "";
		let p2: string = "";
		if (move.includes("("))
			for (let t = 0; t < move.length; t++)
				if (move[t] == "." && (move.slice(0, t).match(/\(/g) || []).length == (move.slice(0, t).match(/\)/g) || []).length) {
					p1 = move.slice(0, t);
					p2 = move.slice(t + 1);
					break;
				}
				else {
					p1 = move.slice(0, move.indexOf("."));
					p2 = move.slice(move.indexOf(".") + 1);
				}
		for (let x2 = lxLim; x2 < xLim; x2++)
			for (let y2 = lyLim; y2 < xLim; y2++) {
				let p1r: Array<Array<number>> | boolean = false;
				if (p1.includes(".") && p1.includes("("))
					for (let t = 0; t < p1.length; t++) {
						if (p1[t] == "." && (p1.slice(0, t).match(/\(/g) || []).length == (p1.slice(0, t).match(/\)/g) || []).length) {
							p1r = Piece.#then(p1, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
							break;
						} else if (t == p1.length - 1)
							p1r = Piece.#rider(p1, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
					}
				else if (p1.includes("."))
					p1r = Piece.#then(p1, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
				else if (p1.includes("("))
					p1r = Piece.#rider(p1, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
				else
					p1r = Piece.#move(p1, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
				let p2r: Array<Array<number>> | boolean = false;
				if (p2.includes(".") && p2.includes("("))
					for (let t = 0; t < p2.length; t++) {
						if (p2[t] == "." && (p2.slice(0, t).match(/\(/g) || []).length == (p2.slice(0, t).match(/\)/g) || []).length) {
							p2r = Piece.#then(p2, x2, y2, x3, y3, direction, turns, xLim, yLim, lxLim, lyLim);
							break;
						} else if (t == p2.length - 1)
							p2r = Piece.#rider(p2, x2, y2, x3, y3, direction, turns, xLim, yLim, lxLim, lyLim);
					}
				else if (p2.includes("."))
					p2r = Piece.#then(p2, x2, y2, x3, y3, direction, turns, xLim, yLim, lxLim, lyLim);
				else if (p2.includes("("))
					p2r = Piece.#rider(p2, x2, y2, x3, y3, direction, turns, xLim, yLim, lxLim, lyLim);
				else
					p2r = Piece.#move(p2, x2, y2, x3, y3, direction, turns, xLim, yLim, lxLim, lyLim);
				if (p1r && p2r) {
					let temp: Array<Array<number>> = [
						[x2, y2],
						[x3, y3]
					];
					if (typeof (p1r) != "boolean")
						temp.push(...p1r);
					if (typeof (p2r) != "boolean")
						temp.push(...p2r);
					return temp;
				}
			}
		return false;
	}

	// General Move Function
	static #move(move: string, x1: number, y1: number, x2: number, y2: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0): boolean {
		let match1: RegExpMatchArray = move.match(/[0-9nN]+(-[0-9nN]+)?/g) as RegExpMatchArray; //.match(/[0-9n]+/g);
		let match2: RegExpMatchArray = move.match(/[0-9nN]+(-[0-9nN]+)?\/[0-9nN]+(-[0-9nN]+)?/g) as RegExpMatchArray; //.match(/[0-9n]+\/[0-9n]+/g);
		let match3: RegExpMatchArray | undefined;
		if (match2)
			match3 = match2[0].match(/[0-9nN]+(-[0-9nN]+)?/g) as RegExpMatchArray; //.match(/[0-9n]+/g);
		// In X-Range
		if (x2 >= xLim || x2 < lxLim)
			return false;
		// In Y-Range
		if (y2 >= yLim || y2 < lyLim)
			return false;
		if (x1 == x2 && y1 == y2)
			return false;
		// Dummy Piece (d)
		if (move.includes("d"))
			return false;
		// Only On First Turn (i/I)
		if (move.includes("i") && turns > 0)
			return false;
		// Orthogonally (+)
		if (move.includes("+") && !((x1 != x2 && y1 == y2) || (y1 != y2 && x1 == x2)))
			return false;
		//Diagonally (x, X)
		if (move.includes("x") && !(Math.abs(x1 - x2) == Math.abs(y1 - y2)))
			return false;
		// Orthogonally or Diagonally (*)
		if ((move.includes("*") || (!move.includes("+") && !move.includes("x") && !move.includes("/"))) && !(((x1 != x2 && y1 == y2) || (y1 != y2 && x1 == x2)) || Math.abs(x1 - x2) == Math.abs(y1 - y2)))
			return false;
		// Forward (>, >=, >r, >l)
		if (move.includes(">") && !move.includes("<") &&
			((move.includes("=") || move.includes("r") || move.includes("l")) ? y1 * direction > y2 * direction : y1 * direction >= y2 * direction))
			return false;
		// Backward (<, <=, <r, <l)
		if (move.includes("<") && !move.includes(">") &&
			((move.includes("=") || move.includes("r") || move.includes("l")) ? y1 * direction < y2 * direction : y1 * direction <= y2 * direction))
			return false;
		// Forward or Backward (<>)
		if (move.includes(">") && move.includes("<") && y1 == y2)
			return false;
		// Orthogonally Sideways (=)
		if (!move.includes(">") && !move.includes("<") && move.includes("=") && y1 != y2)
			return false;
		// Right (r, R) (Relative to Direction 1)
		if (move.includes("r") &&
			((move.includes(">") || move.includes("<")) ? x1 * direction > x2 : x1 * direction >= x2))
			return false;
		// Left (l, L) (Relative to Direction 1)
		if (move.includes("l") &&
			((move.includes(">") || move.includes("<")) ? x1 * direction < x2 : x1 * direction <= x2))
			return false;
		// Distance (1, 1-2, 2, 1-3, 2-3, 3, ..., n)
		if (!match2 &&
			match1 &&
			(match1[0].includes("-") ?
				!((range(parseInt((match1[0].match(/[0-9n]+/g) as RegExpMatchArray)[0]),
					parseInt((match1[0].match(/[0-9n]+/g) as RegExpMatchArray)[1]) + 1
				).includes(Math.abs(x1 - x2)) && (Math.abs(x1 - x2) == Math.abs(y1 - y2) || y1 == y2)) ||
					(range(parseInt((match1[0].match(/[0-9n]+/g) as RegExpMatchArray)[0]),
						parseInt((match1[0].match(/[0-9n]+/g) as RegExpMatchArray)[1]) + 1
					).includes(Math.abs(y1 - y2)) && (Math.abs(y1 - y2) == Math.abs(x1 - x2) || x1 == x2))) :
				(match1[0] != "n" && parseInt(match1[0]) != Math.abs(x1 - x2) &&
					parseInt(match1[0]) != Math.abs(y1 - y2))))
			return false;
		// Two Orthogonal Moves (1/1, 1/1-2, 1/2, 1-2/1, 2/1, 1/1-2s, 1/2s, 1-2/1s, 2/1s, ..., n/n)
		if (match2 && match3 &&
			!(((match3[0].includes("-") ?
				range(parseInt((match3[0].match(/[0-9n]+/g) as RegExpMatchArray)[0]),
					parseInt((match3[0].match(/[0-9n]+/g) as RegExpMatchArray)[1]) + 1
				).includes(Math.abs(x1 - x2)) :
				((match3[0] != "n" && parseInt(match3[0]) == Math.abs(x1 - x2)) || match3[0] == "n")) &&
				(match3[1].includes("-") ?
					range(parseInt((match3[1].match(/[0-9n]+/g) as RegExpMatchArray)[0]),
						parseInt((match3[1].match(/[0-9n]+/g) as RegExpMatchArray)[1]) + 1
					).includes(Math.abs(y1 - y2)) :
					((match3[1] != "n" && parseInt(match3[1]) == Math.abs(y1 - y2)) || match3[1] == "n"))) ||
				(((match3[0].includes("-") ?
					range(parseInt((match3[0].match(/[0-9n]+/g) as RegExpMatchArray)[0]),
						parseInt((match3[0].match(/[0-9n]+/g) as RegExpMatchArray)[1]) + 1
					).includes(Math.abs(y1 - y2)) :
					((match3[0] != "n" && parseInt(match3[0]) == Math.abs(y1 - y2)) || match3[0] == "n")) &&
					(match3[1].includes("-") ?
						range(parseInt((match3[1].match(/[0-9n]+/g) as RegExpMatchArray)[0]),
							parseInt((match3[1].match(/[0-9n]+/g) as RegExpMatchArray)[1]) + 1
						).includes(Math.abs(x1 - x2)) :
						((match3[1] != "n" && parseInt(match3[1]) == Math.abs(x1 - x2)) || match3[1] == "n"))) &&
					!move.includes("s"))))
			return false;
		return true;
	}

	static path(x1: number, y1: number, x2: number, y2: number, c: number = 1): Array<Array<number>> {
		let coords: Array<Array<number>> = [];
		for (let t = 1; t <= Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); t += c)
			coords.push([x1 + (isNaN((x2 - x1) / Math.abs(x2 - x1)) ? 0 :
				((x2 - x1) / Math.abs(x2 - x1))) * t, y1 + (isNaN((y2 - y1) / Math.abs(y2 - y1)) ? 0 : ((y2 - y1) / Math.abs(y2 - y1))) * t]);
		return coords;
	}

	static getPiece(x: number, y: number, others: Array<Piece> = []): Piece | undefined {
		for (let i = 0; i < others.length; i++)
			if (others[i].x == x && others[i].y == y)
				return others[i];
		return;
	}

	static move(moves: string | Array<string>, x1: number, y1: number, x2: number, y2: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, others: Array<Piece> = []): Array<boolean | Array<Piece>> {
		let other: Piece | undefined = Piece.getPiece(x2, y2, others);
		if (other && (direction == other.direction || other.moves.toLowerCase().includes("d")))
			return [false];
		if (typeof (moves) === 'string')
			moves = moves.toLowerCase().replaceAll(" ", "").split(",");
		for (let i = 0; i < moves.length; i++) {
			// Leaper (~)
			if (!moves[i].includes("~") && !moves[i].includes("^") && Piece.path(x1, y1, x2, y2).slice(0, -1).filter(
				(value: Array<number>) => Piece.getPiece(value[0], value[1], others)).length != 0)
				continue;
			// Locust (^)
			if (moves[i].includes("^") && Piece.path(x1, y1, x2, y2, 2).some((arr: Array<number>) => {
				other = Piece.getPiece(arr[0], arr[1], others);
				return (!other || other.direction == direction || other.moves.toLowerCase().includes("d"));
			}))
				continue;
			if (moves[i].includes("(") || moves[i].includes(".")) {
				let step: Array<Array<number>> | boolean = false;
				if (moves[i].includes("(") && moves[i].includes("."))
					for (let t = 0; t < moves[i].length; t++) {
						if (moves[i][t] == "." && (moves[i].slice(0, t).match(/\(/g) || []).length == (moves[i].slice(0, t).match(/\)/g) || []).length) {
							step = Piece.#then(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
							break;
						} else if (t == moves[i].length - 1)
							step = Piece.#rider(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
					}
				else if (moves[i].includes("("))
					step = Piece.#rider(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
				else if (moves[i].includes("."))
					step = Piece.#then(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
				if (!step || ((moves[i].includes("^") ? step : (step as Array<Array<number>>).slice(0, -1)) as Array<Array<number>>).filter(
					(value: Array<number>) => Piece.getPiece(value[0], value[1], others)).length != 0)
					continue;
				else
					// Return success
					if (!other && !moves[i].includes("c"))
						return [true, []];
					else if (other && !moves[i].includes("o"))
						return [true, [other]];
			}
			// Base Move
			if (!Piece.#move(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim))
				continue;
			// Locust (^)
			if (moves[i].includes("^")) {
				// Non-Capture Only (o/O)
				if (moves[i].includes("o"))
					continue;
				let pieces: Array<Piece | Array<number>> = Piece.path(x1, y1, x2, y2, 2);
				for (let i = 0; i < pieces.length; i++)
					pieces[i] = Piece.getPiece((pieces[i] as Array<number>)[0], (pieces[i] as Array<number>)[1], others) as Piece;
				if (pieces.length == 0)
					continue;
				if (moves[i].includes("c") && !other)
					continue;
				else if (other)
					pieces.push(other);
				return [true, pieces as Array<Piece>];
			}
			// Return success
			if (!other && !moves[i].includes("c"))
				return [true, []];
			else if (other && !moves[i].includes("o"))
				return [true, [other]];
		}
		return [false];
	}

	static getMoves(moves: string, x1: number, y1: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, others: Array<Piece> = []): Array<Array<number | boolean>> {
		let arr: Array<Array<number | boolean>> = [];
		for (let x2 = lxLim; x2 < xLim; x2++)
			for (let y2 = lyLim; y2 < yLim; y2++) {
				let move: Array<boolean | Array<Piece>> = Piece.move(moves, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim, others);
				// attack = true; move = false
				if (move[0])
					arr.push([x2, y2, ((move[1] as Array<Piece>).length > 0)]);

			}
		return arr;
	}

	static getChecks(x: number, y: number, direction: number = 1, others: Array<Piece> = []): Array<Piece> {
		let checks: Array<Piece> = [];
		for (let i = 0; i < others.length; i++)
			if (others[i].direction != direction && JSON.stringify(others[i].getMoves(others)).includes(JSON.stringify([x, y, true])))
				checks.push(others[i]);
		return checks;
	}

	static showAlerts(name: string, moves: string, x: number, y: number, direction: number = 1, others: Array<Piece> = []): void {
		if (moves.toLowerCase().includes("k"))
			if (Piece.getChecks(x, y, direction, others).length > 0)
				alert(name + " is in check");
	}

	static hasLost(moves: string, x: number, y: number): boolean {
		return (moves.toLowerCase().includes("k") && x == -1 && y == -1);
	}

	static validate(moves: string = ""): void {
		if ((moves.match(/\(/g) || []).length != (moves.match(/\)/g) || []).length)
			if ((moves.match(/\(/g) || []).length > (moves.match(/\)/g) || []).length)
				console.warn("The moves have more Opening Parenthases ('(') than Closing Parenthases (')'), but we may be able to work around that");
			else
				console.warn("The moves have more Closing Parenthases (')') than Opening Parenthases ('('), but we may be able to work around that");
		if (moves.includes('&'))
			throw Error("The Repeated Movement ('&') Operator has been deprecated, please use the Grouping ('()') Operator instead");
	}

	constructor(x: number, y: number, moves: string = "", direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		this.name = this.constructor.name;
		this.x = x;
		this.y = y;
		this.enPassant = false;
		this.moves = moves;
		Piece.validate(moves);
		this.direction = direction / Math.abs(direction);
		this.color = colors[this.direction == 1 ? 0 : 1];
		this.turns = turns;
		this.xLim = xLim;
		this.yLim = yLim;
		this.lxLim = lxLim;
		this.lyLim = lyLim;
		this.fontFamily = "Verdana";
		this.value = 1;
	}

	move(x: number, y: number, others: Array<Piece> = []): boolean {
		let test: Array<boolean | Array<Piece>> = this.getMove(x, y, others);
		if (test[0]) {
			this.preTest();
			this.x = x;
			this.y = y;
			this.turns++;
			for (let i = 0; i < (test[1] as Array<Piece>).length; i++) {
				(test[1] as Array<Piece>)[i].x = -1;
				(test[1] as Array<Piece>)[i].y = -1;
			}
			this.postTest();
			return true;
		}
		return false;
	}

	getMove(x: number, y: number, others: Array<Piece> = []): Array<boolean | Array<Piece>> {
		return Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
	}

	getMoves(others: Array<Piece> | undefined = []): Array<Array<number | boolean>> {
		return Piece.getMoves(this.moves, this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
	}

	getChecks(others: Array<Piece> = []): Array<Piece> {
		return Piece.getChecks(this.x, this.y, this.direction, others);
	}

	showAlerts(others: Array<Piece> = []): void {
		Piece.showAlerts(this.name, this.moves, this.x, this.y, this.direction, others);
	}

	hasLost(): boolean {
		return Piece.hasLost(this.moves, this.x, this.y);
	}

	forceMove(x: number, y: number): true {
		this.preTest();
		this.x = x;
		this.y = y;
		this.turns++;
		this.postTest();
		return true;
	}

	forceAttack(other: Piece): true {
		this.preTest();
		this.x = other.x;
		this.y = other.y;
		other.x = -1;
		other.y = -1;
		this.turns++;
		this.postTest();
		return true;
	}

	plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		if (this.x == -1 && this.y == -1)
			return;
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x * canvas.width / xSquares, this.y * canvas.height / ySquares, canvas.width / xSquares, canvas.height / ySquares);
	}

	// Runs before the piece is moved to a new location
	preTest(): void { }

	// Runs after the piece is moved to a new location
	postTest(): void { }

	// Runs at the beginning of each player's turn
	turnTest(extraData: ExtraData = {}): ExtraData { return extraData; }
}


class Checker extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "n(^2x>), o1x>", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 1;
	}

	plotBase(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		if (this.x == -1 && this.y == -1)
			return;
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc((this.x + 0.5) * canvas.width / xSquares, (this.y + 0.5) * canvas.height / ySquares, Math.min(canvas.width / xSquares, canvas.height / ySquares) / 2, 0, 2 * Math.PI, false);
		ctx.fill();
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		return this.plotBase(canvas, xSquares, ySquares);
	}

	override postTest(): void {
		if (this.y == (this.direction == 1 ? this.yLim - 1 : 0)) {
			this.moves = "n(^2x), o1x";
			this.plot = function (canvas, xSquares: number = 8, ySquares: number = 8) {
				this.plotBase(canvas, xSquares, ySquares);
				let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
				ctx.fillStyle = "#000000";
				ctx.textAlign = "center";
				ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
				ctx.fillText("\u{2654}", canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
			}
		}
	}
}

class King extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "k1*", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 99;
	}

	override move(x: number, y: number, others: Array<Piece> = []): boolean {
		let test: Array<boolean | Array<Piece>> = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		if (test[0]) {
			this.preTest();
			this.x = x;
			this.y = y;
			this.turns++;
			for (let i = 0; i < (test[1] as Array<Piece>).length; i++) {
				(test[1] as Array<Piece>)[i].x = -1;
				(test[1] as Array<Piece>)[i].y = -1;
			}
			this.postTest();
			return true;
		}
		if (this.turns == 0) {
			let temp: Piece | undefined;
			let n: Array<boolean | Array<Piece>>;
			for (let x2 = this.lxLim; x2 < this.xLim; x2++)
				for (let y2 = this.lyLim; y2 < this.yLim; y2++) {
					if (x2 == this.x && y2 == this.y)
						continue;
					temp = Piece.getPiece(x2, y2, others);
					if (temp && temp.turns == 0 && this.direction == temp.direction) {
						n = temp.getMove((this.x + x) >> 1, (this.y + y) >> 1, others);
						if (Piece.move("io2*", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0] &&
							Piece.move(temp.moves, temp.x, temp.y, this.x, this.y)[0] &&
							temp.getMove(x, y, others)[0] && n[0] && (n[1] as Array<Piece>).length == 0) {
							this.preTest();
							temp.x = (this.x + x) >> 1;
							temp.y = (this.y + y) >> 1;
							this.x = x;
							this.y = y;
							temp.turns++;
							this.turns++;
							temp.postTest();
							this.postTest();
							return true;
						}
					}
				}
		}
		return false;
	}

	override getMove(x: number, y: number, others: Array<Piece> = []): Array<boolean | Array<Piece>> {
		let m: Array<boolean | Array<Piece>> = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		if (m[0])
			return m;
		if (this.turns == 0) {
			let temp: Piece | undefined;
			let n: Array<boolean | Array<Piece>>;
			for (let x2 = this.lxLim; x2 < this.xLim; x2++)
				for (let y2 = this.lyLim; y2 < this.yLim; y2++) {
					if (x2 == this.x && y2 == this.y)
						continue;
					temp = Piece.getPiece(x2, y2, others);
					if (temp && temp.turns == 0 && temp.direction == this.direction) {
						m = Piece.move("io2*", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
						n = temp.getMove((this.x + x) >> 1, (this.y + y) >> 1, others);
						if (m[0] &&
							Piece.move(temp.moves, temp.x, temp.y, this.x, this.y)[0] &&
							temp.getMove(x, y, others)[0] && n[0] && (n[1] as Array<Piece>).length == 0) {
							(m[1] as Array<Piece>).push(temp);
							return m;
						}
					}
				}
		}
		return [false];
	}

	override getMoves(others: Array<Piece> = []): Array<Array<number | boolean>> {
		let m: Array<Array<number | boolean>> = Piece.getMoves(this.moves, this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		if (this.turns == 0) {
			let temp: Piece | undefined;
			let n: Array<boolean | Array<Piece>>;
			let moves: Array<Array<number | boolean>> = Piece.getMoves("io2*", this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
			moves.forEach((coord: Array<number | boolean>): void => {
				let x: number = coord[0] as number;
				let y: number = coord[1] as number;
				for (let x2 = this.lxLim; x2 < this.xLim; x2++)
					for (let y2 = this.lyLim; y2 < this.yLim; y2++) {
						if (x2 == this.x && y2 == this.y)
							continue;
						temp = Piece.getPiece(x2, y2, others);
						if (temp && temp.turns == 0 && temp.direction == this.direction) {
							n = temp.getMove((this.x + x) >> 1, (this.y + y) >> 1, others);
							if (Piece.move("io2*", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0] &&
								Piece.move(temp.moves, temp.x, temp.y, this.x, this.y)[0] &&
								temp.getMove(x, y, others)[0] && n[0] && (n[1] as Array<Piece>).length == 0) {
								m.push([x, y, false]);
								return;
							}
						}
					}
			});
		}
		return m;
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
		ctx.fillText((this.direction == 1 ? "\u{2654}" : "\u{265A}"), canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
	}
}

class Queen extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "n*", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 9;
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
		ctx.fillText((this.direction == 1 ? "\u{2655}" : "\u{265B}"), canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
	}
}

class Rook extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "n+", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 5;
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
		ctx.fillText((this.direction == 1 ? "\u{2656}" : "\u{265C}"), canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
	}
}

class Bishop extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "nx", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 3;
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
		ctx.fillText((this.direction == 1 ? "\u{2657}" : "\u{265D}"), canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
	}
}

class Knight extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "~1/2", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 3;
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
		ctx.fillText((this.direction == 1 ? "\u{2658}" : "\u{265E}"), canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
	}
}

class Pawn extends Piece {
	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "o1>+, c1X>, oi2>+", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.value = 1;
	}

	override move(x: number, y: number, others: Array<Piece> = []): boolean {
		let test: Array<boolean | Array<Piece>> = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		if (test[0]) {
			this.preTest();
			this.x = x;
			this.enPassant = (y - this.y) * this.direction === 2;
			this.y = y;
			this.turns++;
			for (let i = 0; i < (test[1] as Array<Piece>).length; i++) {
				(test[1] as Array<Piece>)[i].x = -1;
				(test[1] as Array<Piece>)[i].y = -1;
			}
			this.postTest();
			return true;
		}
		let temp: Piece | undefined = Piece.getPiece(x, this.y, others);
		if (temp && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant &&
			Piece.move("o1X>", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
			this.preTest();
			this.x = x;
			this.y = y;
			this.turns++;
			temp.x = -1;
			temp.y = -1;
			this.postTest();
			return true;
		}
		return false;
	}

	override getMove(x: number, y: number, others: Array<Piece> = []): Array<boolean | Array<Piece>> {
		let m: Array<boolean | Array<Piece>> = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		if (m[0])
			return m;
		let temp: Piece | undefined = Piece.getPiece(x, this.y, others);
		if (temp && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant) {
			m = Piece.move("o1X>", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
			if (m[0]) {
				(m[1] as Array<Piece>).push(temp);
				return m;
			}
		}
		return [false];
	}

	override getMoves(others: Array<Piece> = []): Array<Array<number | boolean>> {
		let m: Array<Array<number | boolean>> = Piece.getMoves(this.moves, this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		let temp: Piece | undefined = Piece.getPiece(this.x - this.direction, this.y, others);
		if (temp && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant &&
			Piece.move("o1Xl>", this.x, this.y, this.x - this.direction, this.y + this.direction, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
			m.push([this.x - this.direction, this.y + this.direction, true]);
		}
		temp = Piece.getPiece(this.x + this.direction, this.y, others);
		if (temp && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant &&
			Piece.move("o1Xr>", this.x, this.y, this.x + this.direction, this.y + this.direction, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
			m.push([this.x + this.direction, this.y + this.direction, true]);
		}
		return m;
	}

	override plot(canvas: HTMLCanvasElement, xSquares: number = 8, ySquares: number = 8): void {
		let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.textAlign = "center";
		ctx.fillStyle = this.color;
		ctx.font = String(Math.min(canvas.width / this.xLim, canvas.height / this.yLim)) + "px " + this.fontFamily;
		ctx.fillText((this.direction == 1 ? "\u{2659}" : "\u{265F}"), canvas.width / this.xLim * (this.x + 0.5), canvas.height / this.yLim * (this.y + 0.875));
	}

	override turnTest(extraData: ExtraData = {}): ExtraData {
		if (this.y == ((this.direction == -1) ? 0 : ((this.direction == 1) ? this.yLim - 1 : false))) {
			const choices: Array<string> = ["Queen",
				"Bishop",
				"Rook",
				"Pawn",
				"Knight"];
			let str: string | null = null;
			if (extraData.PawnPromotion !== undefined && choices.includes(extraData.PawnPromotion))
				str = extraData.PawnPromotion;
			else {
				while (!str || !choices.includes(str)) {
					str = prompt(JSON.stringify(choices), "queen")
					if (str) {
						str = str.trim();
						str = str[0].toUpperCase() + str.slice(1).toLowerCase();
					}
				}
			}

			let p: Piece = eval(`new ${str}(${this.x}, ${this.y}, ${this.direction}, ${this.turns}, ${this.xLim}, ${this.yLim}, ${this.lxLim}, ${this.lyLim})`);
			Object.assign(this, p);
			this.move = p.move;
			this.getMove = p.getMove;
			this.getMoves = p.getMoves;
			this.plot = p.plot;
			this.turnTest = p.turnTest;

			return { PawnPromotion: str };
		}
		return {};
	}
}

class PowerUp extends Piece {
	movesList: Array<string>;
	moveIndex: number;

	constructor(x: number, y: number, direction: number = 1, turns: number = 0,
		xLim: number = 8, yLim: number = 8, lxLim: number = 0, lyLim: number = 0, colors: Array<string> = ["#FF00FF", "#00FFFF"]) {
		super(x, y, "", direction, turns, xLim, yLim, lxLim, lyLim, colors);
		this.movesList = ["o1>+, c1X>, oi2>+", "1*", "~1/2", "nx", "n+", "n*"];
		this.moveIndex = 0;
		this.moves = this.movesList[this.moveIndex];
	}

	override move(x: number, y: number, others: Array<Piece> = []): boolean {
		if (super.move(x, y, others)) {
			this.moves = this.movesList[(++this.moveIndex) % this.movesList.length];
			return true;
		}
		return false;
	}
}

/*
let p0 = new Piece(0, 0, "1>+, 2i>+, 1c>x"); // Test Move Coordinates
console.log(p0.move(0, 2));

let p1 = new Piece(0, 0, "nx", 1); // Test Attack Piece Coordinates
console.log(p1.attack(3, 3, [new Piece(3, 3, "", -1)]));

let p2 = new Piece(0, 0, "n*, n(~1/2)", 1); // Test Rider
console.log(p2.move(3, 6));

let p3 = new Piece(0, 0, "1x.n+", 1); // Test Then
console.log(p3.move(1, 3));

let p4 = new Piece(0, 0, "n(1x.2+)", 1); // Test Then in Rider
console.log(p4.move(2, 6));

let p5 = new Piece(0, 0, "n(~1/2).1*", 1); // Test Rider in Then
console.log(p5.move(3, 7));

let p6 = new Piece(0, 0, "n(1x.2+).n(~2*)", -1); // Test Then in Rider in Then
console.log(p6.move(6, 6));

let p7 = new Piece(3, 3, "cn(^2x), o1x", 1); // Test Hopper
console.log(p7.attack(5, 5, [new Piece(4, 4, "", -1), new Piece(6, 6, "", -1)]));
*/
