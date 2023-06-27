"use strict";

interface ExtraData {
	PawnPromotion?: string
}

// start: int, end: int = NaN, step: int = 1 -> array[int, ...]
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
 * * '~' = Jumping Operator (Knights)
* * 'i'/'I' = Only Use on First Movement of Piece
 * * 'c'/'C' = Only Use on Capturing Piece (Only applies to final square being landed on)
 * * 'o'/'O' = Only Use on Not Capturing Piece
 * * '^' = Locust Operator (Checkers) (Must capture between each jump)
 * * 'k'/'K' = King flag that enables notifications when placed into check by another piece
 *
 * Missing:
 * * Castling
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
		// Forward (>, >=)
		if (move.includes(">") && !move.includes("<") &&
			(move.includes("=") ? y1 * direction > y2 * direction : y1 * direction >= y2 * direction))
			return false;
		// Backward (<, <=)
		if (move.includes("<") && !move.includes(">") &&
			(move.includes("=") ? y1 * direction < y2 * direction : y1 * direction <= y2 * direction))
			return false;
		// Forward or Backward (<>)
		if (move.includes(">") && move.includes("<") && y1 == y2)
			return false;
		// Orthogonally Sideways (=)
		if (!move.includes(">") && !move.includes("<") && move.includes("=") && y1 != y2)
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
		// Two Orthogonal Moves (1/1, 1/2, 2/1, ..., n/n)
		if (match2 && match3 &&
			!(
				(((match3[0] != "n" && parseInt(match3[0]) == Math.abs(x1 - x2)) || match3[0] == "n") &&
					(((match3[1] != "n" && parseInt(match3[1]) == Math.abs(y1 - y2)) || match3[1] == "n")) ||
					(
						(((match3[0] != "n" && parseInt(match3[0]) == Math.abs(y1 - y2)) || match3[0] == "n") &&
							((match3[1] != "n" && parseInt(match3[1]) == Math.abs(x1 - x2)) || match3[1] == "n"))))))
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
			// Base Move
			if (!Piece.#move(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim))
				continue;
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
		let temp: Piece | undefined;
		for (let x2 = this.lxLim; x2 < this.xLim; x2++) {
			temp = Piece.getPiece(x2, y, others);
			if (temp && temp.constructor.name == "Rook" && this.turns == 0 && temp.turns == 0 &&
				Piece.move("io2=", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0] &&
				Piece.move("ion=", temp.x, temp.y, (this.x + x) >> 1, temp.y, temp.direction, temp.turns, temp.xLim, temp.yLim, temp.lxLim, temp.lyLim, others)[0]) {
				this.preTest();
				if (temp.x > this.x) {
					this.x += 2;
					temp.x = this.x - 1;
				} else {
					this.x -= 2;
					temp.x = this.x + 1;
				}
				this.turns++;
				temp.turns++;
				this.postTest();
				temp.postTest();
				return true;
			}
		}
		return false;
	}

	override getMove(x: number, y: number, others: Array<Piece> = []): Array<boolean | Array<Piece>> {
		let m: Array<boolean | Array<Piece>> = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		if (m[0])
			return m;
		let temp: Piece | undefined;
		let n: Array<boolean | Array<Piece>>;
		for (let x2 = this.lxLim; x2 < this.xLim; x2++) {
			temp = Piece.getPiece(x2, y, others);
			if (temp && temp.constructor.name == "Rook" && this.turns == 0 && temp.turns == 0) {
				m = Piece.move("io2=", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
				n = Piece.move("ion=", temp.x, temp.y, (this.x + x) >> 1, temp.y, temp.direction, temp.turns, temp.xLim, temp.yLim, temp.lxLim, temp.lyLim, others);
				if (m[0] && n[0]) {
					(m[1] as Array<Piece>).push(temp);
					return m;
				}
			}
		}
		return [false];
	}

	override getMoves(others: Array<Piece> = []): Array<Array<number | boolean>> {
		let m: Array<Array<number | boolean>> = Piece.getMoves(this.moves, this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
		let temp: Piece | undefined;
		for (let x = this.lxLim; x < this.xLim; x++) {
			temp = Piece.getPiece(x, this.y, others);
			if (temp && temp.constructor.name == "Rook" && this.turns == 0 && temp.turns == 0)
				if (Piece.move("io2=", this.x, this.y, this.x - 2, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0] &&
					Piece.move("ion=", temp.x, temp.y, ((this.x << 1) - 2) >> 1, temp.y, temp.direction, temp.turns, temp.xLim, temp.yLim, temp.lxLim, temp.lyLim, others)[0])
					m.push([this.x - 2, this.y, false]);
				else if (Piece.move("io2=", this.x, this.y, this.x + 2, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0] &&
					Piece.move("ion=", temp.x, temp.y, ((this.x << 1) + 2) >> 1, temp.y, temp.direction, temp.turns, temp.xLim, temp.yLim, temp.lxLim, temp.lyLim, others)[0])
					m.push([this.x + 2, this.y, false]);
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

	// x: int, y: int, other: array[Piece, ...] = [] -> array[bool, array[Piece, ...]]
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
