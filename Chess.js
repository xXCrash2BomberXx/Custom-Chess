"use strict";

// start: int, end: int = NaN, step: int = 1 -> array[int, ...]
function range (start, end = NaN, step = 1) {
    if (isNaN(end)) {
        end = start;
        start = 0;
    }
    let arr = [];
    for (let i = start; i < end; i += step)
        arr.push(i);
    return arr;
}

// char: str = " " -> int
String.prototype.count = function(char=" ") {
    return this.split("").reduce((acc, ch) => ch === char ? acc + 1 : acc, 0);
};


/**
 * Recommended Order:
 * * <conditions> <move type> <distance> <direction> <other>
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
 * * 'i'/'I' = Only Use on First Movement of Piece
 * * 'c'/'C' = Only Use on Capturing Piece (Only applies to final square being landed on)
 * * 'o'/'O' = Only Use on Not Capturing Piece
 * * ',' = Add Different Movements to a Piece
 * * 'k'/'K' = King flag that enables notifications when placed into check by another piece
 * 
 * Missing:
 * * En Passant
 * * Castling
 */

class Piece {
    // General Move Function
    // move: str, x1: int, y2: int, x2: int, y2: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> bool
    static #move(move, x1, y1, x2, y2, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0) {
        let match1 = move.match(/[0-9nN]+(-[0-9nN]+)?/g); //.match(/[0-9n]+/g);
        let match2 = move.match(/[0-9nN]+(-[0-9nN]+)?\/[0-9nN]+(-[0-9nN]+)?/g); //.match(/[0-9n]+\/[0-9n]+/g);
        if (match2 != null) {
            var match3 = match2[0].match(/[0-9nN]+(-[0-9nN]+)?/g); //.match(/[0-9n]+/g);
        }
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
        // Forward (>, >=, >r, >l)
        if (move.includes(">") && !move.includes("<") &&
            ((move.includes("=") || move.includes("r") || move.includes("l")) ? y1 * direction > y2 * direction  : y1 * direction >= y2 * direction))
            return false;
        // Backward (<, <=, <r, <l)
        if (move.includes("<") && !move.includes(">") &&
            ((move.includes("=") || move.includes("r") || move.includes("l")) ? y1 * direction < y2 * direction: y1 * direction <= y2 * direction))
            return false;
        // Forward or Backward (<>)
        if (move.includes(">") && move.includes("<") && y1 == y2)
            return false;
        // Orthogonally Sideways (=)
        if (!move.includes(">") && !move.includes("<") && move.includes("=") && y1 != y2)
            return false;
        // Distance (1, 2, 3, ..., n)
        if (!match2 && match1 != null &&
            (match1[0] != "n" && parseInt(match1[0]) != Math.abs(x1 - x2) &&
                    parseInt(match1[0]) != Math.abs(y1 - y2)))
            return false;
        // Two Orthogonal Moves (1/1, 1/2, 2/1, ..., n/n)
		if (match2 != null &&
			!(
				(((match3[0] != "n" && parseInt(match3[0]) == Math.abs(x1 - x2)) || match3[0] == "n") &&
				(((match3[1] != "n" && parseInt(match3[1]) == Math.abs(y1 - y2)) || match3[1] == "n")) ||
			(
				(((match3[0] != "n" && parseInt(match3[0]) == Math.abs(y1 - y2)) || match3[0] == "n") &&
				((match3[1] != "n" && parseInt(match3[1]) == Math.abs(x1 - x2)) || match3[1] == "n"))))))
            return false;
        return true;
    }

    // x1: int, y1: int, x2: int, y2: int -> array[array[int, int], ...]
    static path(x1, y1, x2, y2, c = 1) {
        let coords = [];
        for (let t = 1; t <= Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); t += c)
            coords.push([x1 + (isNaN((x2 - x1) / Math.abs(x2 - x1)) ? 0 :
                ((x2 - x1) / Math.abs(x2 - x1))) * t, y1 + (isNaN((y2 - y1) / Math.abs(y2 - y1)) ? 0 : ((y2 - y1) / Math.abs(y2 - y1))) * t]);
        return coords;
    }

    // x: int, y: int, other: array[Piece, ...] = [] -> Piece
    static getPiece(x, y, others = []) {
        for (let i = 0; i < others.length; i++)
            if (others[i].x == x && others[i].y == y)
                return others[i];
    }

    // moves: str, x1: int, y1: int, x2: int, y2: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0, others: array[Piece, ...] = [] -> array[bool, array[Piece, ...]]
    static move(moves, x1, y1, x2, y2, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, others = []) {  // -> Array[Bool, Array[Piece, ...]]
        let other = Piece.getPiece(x2, y2, others);
        if (other != null && (direction == other.direction || other.moves.toLowerCase().includes("d")))
            return [false];
        moves = moves.toLowerCase().replaceAll(" ", "").split(",");
        for (let i = 0; i < moves.length; i++) {
            // Leaper (~)
            if (!moves[i].includes("~") && !moves[i].includes("^") && Piece.path(x1, y1, x2, y2).slice(0, -1).filter(
                    value => Piece.getPiece(value[0], value[1], others) != null).length != 0)
                continue;
            // Base Move
            if (!Piece.#move(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim))
                continue;
            // Return success
            if (other == null && !moves[i].includes("c"))
                return [true, []];
            else if (other != null && !moves[i].includes("o"))
                return [true, [other]];
        }
        return [false];
    }

    // moves: str, x1: int, y1: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0, others: array[Piece, ...] = [] -> array[array[int, int, bool], ...]
    static getMoves(moves, x1, y1, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, others = []) {
        let arr = [];
        for (let x2 = lxLim; x2 < xLim; x2++)
            for (let y2 = lyLim; y2 < yLim; y2++) {
                let move = Piece.move(moves, x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim, others);
                // attack = true; move = false
                if (move[0])
                    arr.push([x2, y2, (move[1].length > 0)]);
                
            }
        return arr;
    }

    // x: int, y: int, direction: int = 1, others: array[Piece, ...] = [] -> array[Piece, ...]
	static getChecks(x, y, direction = 1, others = []) {
		let checks = [];
		for (let i = 0; i < others.length; i++)
            if (others[i].direction != direction && JSON.stringify(others[i].getMoves(others)).includes(JSON.stringify([x, y, true])))
            	checks.push(others[i]);
		return checks;
	}

    // name: str, moves: str, x: int, y: int, direction: int = 1, others: array[Piece, ...] = [] -> alert
    static showAlerts(name, moves, x, y, direction = 1, others = []) {
        if (moves.toLowerCase().includes("k"))
            if (Piece.getChecks(x, y, direction, others).length > 0)
                alert(name+" is in check");
    }

    // moves: str, x: int, y: int -> null
    static hasLost(moves, x, y) {
        return (moves.toLowerCase().includes("k") && x == -1 && y == -1);
    }

    // moves: str = "" -> null
    static validate(moves = "") {
        if (moves.count("(") != moves.count(")"))
            if (moves.count("(") > moves.count(")"))
                console.warn("The moves have more Opening Parenthases ('(') than Closing Parenthases (')'), but we may be able to work around that");
            else
                console.warn("The moves have more Closing Parenthases (')') than Opening Parenthases ('('), but we may be able to work around that");
        if (moves.includes('&'))
            throw Error("The Repeated Movement ('&') Operator has been deprecated, please use the Grouping ('()') Operator instead");
    }

    // x: int, y: int, moves: str = "", direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor(x, y, moves = "", direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        this.name = this.constructor.name;
        this.x = x;
        this.y = y;
        this.enPassant = false;
        this.moves = moves;
        Piece.validate(moves);
        this.direction = direction / Math.abs(direction);
        this.color = colors[this.direction==1?0:1];
        this.turns = 0;
        this.xLim = xLim;
        this.yLim = yLim;
        this.lxLim = lxLim;
        this.lyLim = lyLim;
    }

    // x: int, y: int, others: array[Piece, ...] = [] -> bool
    move(x, y, others = []) {
        let test = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
        if (test[0]) {
			this.preTest();
            this.x = x;
            this.y = y;
            this.turns++;
            for (let i = 0; i < test[1].length; i++) {
                test[1][i].x = -1;
                test[1][i].y = -1;
            }
            this.postTest();
            return true;
        }
        return false;
    }

    // others: array[Piece, ...] = [] -> array[array[int, int, bool], ...]
    getMoves(others = []) {
        return Piece.getMoves(this.moves, this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
    }

    // others: array[Piece, ...] = [] -> array[Piece, ...]
    getChecks(others = []) {
        return Piece.getChecks(this.x, this.y, this.direction, others);
    }

    // others: array[Piece, ...] -> alert
    showAlerts(others = []) {
        Piece.showAlerts(this.name, this.moves, this.x, this.y, this.direction, others);
    }

    // null -> bool
    hasLost() {
        return Piece.hasLost(this.moves, this.x, this.y);
    }

    // x: int, y: int -> bool[true]
    forceMove(x, y) {
		this.preTest();
        this.x = x;
        this.y = y;
        this.turns++;
        this.postTest();
        return true;
    }

    // other: Piece -> bool[true]
    forceAttack(other) {
		this.preTest();
        this.x = other.x;
        this.y = other.y;
        other.x = -1;
        other.y = -1;
        this.turns++;
        this.postTest();
        return true;
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        if (this.x == -1 && this.y == -1)
            return;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x*canvas.width/xSquares, this.y*canvas.height/ySquares, canvas.width/xSquares, canvas.height/ySquares);
    }

    // Runs before the piece is moved to a new location
    // null -> null
    preTest () {}

    // Runs after the piece is moved to a new location
    // null -> null
    postTest () {}

    // Runs at the beginning of each player's turn
    // null -> null
    turnTest () {}
}

class King extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "k1*", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
        ctx.fillText((this.direction == 1?"\u{2654}":"\u{265A}"), canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
    }
}

class Queen extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "n*", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
        ctx.fillText((this.direction == 1?"\u{2655}":"\u{265B}"), canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
    }
}

class Rook extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "n+", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
        ctx.fillText((this.direction == 1?"\u{2656}":"\u{265C}"), canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
    }
}

class Bishop extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "nx", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
        ctx.fillText((this.direction == 1?"\u{2657}":"\u{265D}"), canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
    }
}

class Knight extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "~1/2", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
        ctx.fillText((this.direction == 1?"\u{2658}":"\u{265E}"), canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
    }
}

class Pawn extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "o1>+, c1X>, oi2>+", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // x: int, y: int, others: array[Piece, ...] = [] -> bool
    move(x, y, others = []) {
        let test = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
        if (test[0]) {
			this.preTest();
            this.x = x;
            this.enPassant = (y-this.y)*this.direction === 2;
            this.y = y;
            this.turns++;
            for (let i = 0; i < test[1].length; i++) {
                test[1][i].x = -1;
                test[1][i].y = -1;
            }
            this.postTest();
            return true;
        }
        let temp = Piece.getPiece(this.x-1, this.y, others);
        if (temp != null && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant && 
            Piece.move("o1Xl>", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
            this.preTest();
            this.x = x;
            this.y = y;
            this.turns++;
            temp.x = -1;
            temp.y = -1;
            this.postTest();
            return true;
        }
        temp = Piece.getPiece(this.x+1, this.y, others);
        if (temp != null && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant && 
            Piece.move("o1Xr>", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
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
    getMove(x, y, others = []) {
        let m = Piece.move(this.moves, this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
        if (m[0])
            return m;
        let temp = Piece.getPiece(this.x-1, this.y, others);
        if (temp != null && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant) {
            m = Piece.move("o1Xl>", this.x, this.y, x, y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
            if (m[0])
                return m;
        }
        temp = Piece.getPiece(this.x+1, this.y, others);
        if (temp != null && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant) {
            m = Piece.move("o1Xr>", this.x, this.y, this.x+1, this.y+this.direction, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
            if (m[0])
                return m;
        }
        return m;
    }

    // others: array[Piece, ...] = [] -> array[array[int, int, bool], ...]
    getMoves(others = []) {
        let m = Piece.getMoves(this.moves, this.x, this.y, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others);
        let temp = Piece.getPiece(this.x-1, this.y, others);
        if (temp != null && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant && 
            Piece.move("o1Xl>", this.x, this.y, this.x-1, this.y+this.direction, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
            m.push([this.x-1, this.y+this.direction, true]);
        }
        temp = Piece.getPiece(this.x+1, this.y, others);
        if (temp != null && temp.constructor.name == "Pawn" && temp.turns == 1 && temp.enPassant && 
            Piece.move("o1Xr>", this.x, this.y, this.x+1, this.y+this.direction, this.direction, this.turns, this.xLim, this.yLim, this.lxLim, this.lyLim, others)[0]) {
            m.push([this.x+1, this.y+this.direction, true]);
        }
        return m;
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot(canvas, xSquares = 8, ySquares = 8) {
        let ctx = canvas.getContext("2d");
        ctx.textAlign = "center";
        ctx.fillStyle = this.color;
        ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
        ctx.fillText((this.direction == 1?"\u{2659}":"\u{265F}"), canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
    }

    // null -> null
    postTest () {
        if (this.y == ((this.direction==-1)?0:((this.direction == 1)?this.yLim-1: false))) {
            var choices = ["Queen",
                            "Bishop",
                            "Rook",
                            "Pawn",
                            "Knight"];
            var str = "";
            while (!choices.includes(str)) {
                str = prompt(JSON.stringify(choices), "queen").trim();
                str = str[0].toUpperCase()+str.slice(1).toLowerCase();
            }
            let p = eval("new "+str+"("+this.x+", "+this.y+", "+this.direction+", "+this.turns+", "+this.xLim+", "+this.yLim+", "+this.lxLim+", "+this.lyLim+")");
            Object.assign(this, p);
            this.plot = p.plot;
            this.postTest = p.postTest;
        }
    }
}
