"use strict";

// start: int, end: int = NaN, step: int = 1 -> array[int, ...]
function range(start, end = NaN, step = 1) {
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
 * https://en.m.wikipedia.org/wiki/Fairy_chess_piece#0%E2%80%939
 * 
 * Recommended Order:
 * * <conditions> <move type> <distance> <direction> <other>
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
 * 
 * Missing:
 * * En Passant
 * * Castling
 * * Check/Win Alerts
 */

class Piece {
    // Rider (n())
    // move: str, x1: int, y2: int, x2: int, y2: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> bool
    static #rider(move, x1, y1, x2, y2, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0) {
        while (move.count("(") > move.count(")"))
            move += ")";
        while (move.count("(") < move.count(")"))
            move = "(" + move;
        let factor = move.slice(0, move.indexOf("("));
        if (!(factor.match(/[0-9]+$/) || factor.match(/[nN]$/)))
            factor = factor + "1";
        let pattern = move.slice(move.indexOf("(") + 1, move.lastIndexOf(")"));
        if (factor.match(/[0-9]+$/)) {
            if (Math.abs(x2 - x1) % parseInt(factor.match(/[0-9]+$/g)[0]) == 0 && Math.abs(y2 - y1) % parseInt(factor.match(/[0-9]+$/g)[0]) == 0) {
                let temp = [];
                for (let i = 0; i < parseInt(factor.match(/[0-9]+$/g)[0]); i++) {
                    if (pattern.includes("(") && pattern.includes(".")) {
                        var temp2;
                        for (let t = 0; t < pattern.length; t++)
                            if (pattern[t] == "." && pattern.slice(0, t).count("(") == pattern.slice(0, t).count(")")) {
                                temp2 = Piece.#then(factor.slice(0, factor.match(/[0-9]+$/).index) +
                                    pattern.slice(0, t) + "." +
                                    factor.slice(0, factor.match(/[0-9]+$/)) + pattern.slice(t + 1),
                                    x1 + i * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + i * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                                    x1 + (i + 1) * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + (i + 1) * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                                    direction, turns, xLim, yLim, lxLim, lyLim);
                                break;
                            } else if (t == pattern.length - 1) {
                                temp2 = Piece.#rider(factor.slice(0, factor.match(/[0-9]+$/).index) + pattern,
                                    x1 + i * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + i * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                                    x1 + (i + 1) * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + (i + 1) * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                                    direction, turns, xLim, yLim, lxLim, lyLim);
                            }
                        if (temp2)
                            temp.push(...temp2);
                        else
                            return false;
                    } else if (pattern.includes("(")) {
                        let temp2 = Piece.#rider(factor.slice(0, factor.match(/[0-9]+$/).index) + pattern,
                            x1 + i * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + i * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                            x1 + (i + 1) * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + (i + 1) * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                            direction, turns, xLim, yLim, lxLim, lyLim);
                        if (temp2)
                            temp.push(...temp2);
                        else
                            return false;
                    } else if (move.includes(".")) {
                        let temp2 = Piece.#then(factor.slice(0, factor.match(/[0-9]+$/).index) +
                            pattern.slice(0, pattern.indexOf(".")) + "." +
                            factor.slice(0, factor.match(/[0-9]+$/).index) + pattern.slice(pattern.indexOf(".") + 1),
                            x1 + i * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + i * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                            x1 + (i + 1) * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + (i + 1) * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                            direction, turns, xLim, yLim, lxLim, lyLim);
                        if (temp2)
                            temp.push(...temp2);
                        else
                            return false;
                    } else if (Piece.#move(factor.slice(0, factor.match(/[0-9]+$/).index) + pattern,
                            x1 + i * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + i * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                            x1 + (i + 1) * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + (i + 1) * (y2 - y1) / factor.match(/[0-9]+$/g)[0],
                            direction, turns, xLim, yLim, lxLim, lyLim))
                        temp.push([x1 + (i + 1) * (x2 - x1) / factor.match(/[0-9]+$/g)[0], y1 + (i + 1) * (y2 - y1) / factor.match(/[0-9]+$/g)[0]]);
                    else
                        return false;
                }
                return temp;
            }
        } else if (factor.match(/[nN]$/)) {
            let temp = false;
            for (let i = 1; i < Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); i++) {
                temp = Piece.#rider(factor.slice(0, factor.match(/[nN]$/).index) + String(i) + move.slice(move.indexOf("("), move.indexOf(")") + 1),
                    x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
                if (temp)
                    return temp;
            }
            return false;
        } else
            return false;
    }

    // Then (.)
    // move: str, x1: int, y1: int, x3: int, y3: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> bool
    static #then(move, x1, y1, x3, y3, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0) {
        var p1;
        var p2;
        if (move.includes("("))
            for (let t = 0; t < move.length; t++)
                if (move[t] == "." && move.slice(0, t).count("(") == move.slice(0, t).count(")")) {
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
                var p1r;
                if (p1.includes(".") && p1.includes("("))
                    for (let t = 0; t < p1.length; t++) {
                        if (p1[t] == "." && p1.slice(0, t).count("(") == p1.slice(0, t).count(")")) {
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
                var p2r;
                if (p2.includes(".") && p2.includes("("))
                    for (let t = 0; t < p2.length; t++) {
                        if (p2[t] == "." && p2.slice(0, t).count("(") == p2.slice(0, t).count(")")) {
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
                    let temp = [
                        [x2, y2],
                        [x3, y3]
                    ];
                    if (typeof(p1r) != "boolean")
                        temp.push(...p1r);
                    if (typeof(p2r) != "boolean")
                        temp.push(...p2r);
                    return temp;
                }
            }
        return false;
    }

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
            match1 != null &&
            (match1[0].includes("-") ?
                !((range(parseInt(match1[0].match(/[0-9n]+/g)[0]),
                        parseInt(match1[0].match(/[0-9n]+/g)[1]) + 1
                    ).includes(Math.abs(x1 - x2)) && (Math.abs(x1 - x2) == Math.abs(y1 - y2) || y1 == y2)) ||
                    (range(parseInt(match1[0].match(/[0-9n]+/g)[0]),
                        parseInt(match1[0].match(/[0-9n]+/g)[1]) + 1
                    ).includes(Math.abs(y1 - y2)) && (Math.abs(y1 - y2) == Math.abs(x1 - x2) || x1 == x2))) :
                (match1[0] != "n" && parseInt(match1[0]) != Math.abs(x1 - x2) &&
                    parseInt(match1[0]) != Math.abs(y1 - y2))))
            return false;
        // Two Orthogonal Moves (1/1, 1/1-2, 1/2, 1-2/1, 2/1, 1/1-2s, 1/2s, 1-2/1s, 2/1s, ..., n/n)
        console.log(match2)
		if (match2 != null &&
            !(((match3[0].includes("-") ?
                        range(parseInt(match3[0].match(/[0-9n]+/g)[0]),
                            parseInt(match3[0].match(/[0-9n]+/g)[1]) + 1
                        ).includes(Math.abs(x1 - x2)) :
                        ((match3[0] != "n" && parseInt(match3[0]) == Math.abs(x1 - x2)) || match3[0] == "n")) &&
                    (match3[1].includes("-") ?
                        range(parseInt(match3[1].match(/[0-9n]+/g)[0]),
                            parseInt(match3[1].match(/[0-9n]+/g)[1]) + 1
                        ).includes(Math.abs(y1 - y2)) :
                        ((match3[1] != "n" && parseInt(match3[1]) == Math.abs(y1 - y2)) || match3[1] == "n"))) ||
                (((match3[0].includes("-") ?
                            range(parseInt(match3[0].match(/[0-9n]+/g)[0]),
                                parseInt(match3[0].match(/[0-9n]+/g)[1]) + 1
                            ).includes(Math.abs(y1 - y2)) :
                            ((match3[0] != "n" && parseInt(match3[0]) == Math.abs(y1 - y2)) || match3[0] == "n")) &&
                        (match3[1].includes("-") ?
                            range(parseInt(match3[1].match(/[0-9n]+/g)[0]),
                                parseInt(match3[1].match(/[0-9n]+/g)[1]) + 1
                            ).includes(Math.abs(x1 - x2)) :
                            ((match3[1] != "n" && parseInt(match3[1]) == Math.abs(x1 - x2)) || match3[1] == "n"))) &&
                    !move.includes("s"))))
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
    static move(moves, x1, y1, x2, y2, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, others = []) {  // -> Array[Bool, Array[Piece]]
        let other = Piece.getPiece(x2, y2, others);
        if (other != null && (direction == other.direction || other.moves.toLowerCase().includes("d")))
            return [false];
        moves = moves.toLowerCase().replaceAll(" ", "").split(",");
        for (let i = 0; i < moves.length; i++) {
            // Leaper (~)
            if (!moves[i].includes("~") && !moves[i].includes("^") && Piece.path(x1, y1, x2, y2).slice(0, -1).filter(
                    value => Piece.getPiece(value[0], value[1], others) != null).length != 0)
                continue;
            // Locust (^)
            if (moves[i].includes("^") && Piece.path(x1, y1, x2, y2, 2).some(
                function(arr) {
                    let other = Piece.getPiece(...arr, others);
                    return (other == null || other.direction == direction || other.moves.toLowerCase().includes("d"));
                }
            ))
                continue;
            if (moves[i].includes("(") || moves[i].includes(".")) {
                var step;
                if (moves[i].includes("(") && moves[i].includes("."))
                    for (let t = 0; t < moves[i].length; t++) {
                        if (moves[i][t] == "." && moves[i].slice(0, t).count("(") == moves[i].slice(0, t).count(")")) {
                            step = Piece.#then(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
                            break;
                        } else if (t == moves[i].length - 1)
                            step = Piece.#rider(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
                    }
                else if (moves[i].includes("("))
                    step = Piece.#rider(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
                else if (moves[i].includes("."))
                    step = Piece.#then(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim);
                if (!step || (moves[i].includes("^") ? step : step.slice(0, -1)).filter(
                        value => Piece.getPiece(value[0], value[1], others) != null).length != 0)
                    continue;
            // Base Move
            } else if (!Piece.#move(moves[i].replaceAll("^", "~"), x1, y1, x2, y2, direction, turns, xLim, yLim, lxLim, lyLim))
                continue;
            // Locust (^)
            if (moves[i].includes("^")) {
                // Non-Capture Only (o/O)
                if (moves[i].includes("o"))
                    continue;
                let pieces = Piece.path(x1, y1, x2, y2, 2);
                for (let i = 0; i < pieces.length; i++) {
                    pieces[i] = Piece.getPiece(...pieces[i], others);
                }
                if (pieces.length == 0)
                    continue;
                if (moves[i].includes("c") && other == null)
                        continue;
                else if (other != null)
                    pieces.push(other);
                return [true, pieces];
            // Return success
            } else
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

	static getChecks(x, y, direction = 1, others = []) {
		let checks = [];
		for (let i = 0; i < others.length; i++)
            if (JSON.stringify(others[i].direction != direction && others[i].getMoves(others)).includes(JSON.stringify([x, y, true])))
            	checks.push(others[i]);
		return checks;
	}

    getChecks(others = []) {
        return Piece.getChecks(this.x, this.y, this.direction, others);
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

    // null -> null
    preTest () {}

    // null -> null
    postTest () {}
}


class Checker extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "n(^2x>), o1x>", direction, turns, xLim, yLim, lxLim, lyLim, colors);
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plotBase (canvas, xSquares = 8, ySquares = 8) {
        if (this.x == -1 && this.y == -1)
            return;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc((this.x+0.5)*canvas.width/xSquares, (this.y+0.5)*canvas.height/ySquares, Math.min(canvas.width/xSquares, canvas.height/ySquares)/2, 0, 2*Math.PI, false);
        ctx.fill();
    }

    // canvas: canvas, xSquares: int = 8, ySquares: int = 8 -> null
    plot (canvas, xSquares = 8, ySquares = 8) {
        return this.plotBase(canvas, xSquares, ySquares);
    }

    // null -> null
    test () {
        if (this.y == (this.direction == 1 ? this.yLim-1 : 0)) {
            this.moves = "n(^2x), o1x";
            this.plot = function (canvas, xSquares = 8, ySquares = 8) {
                this.plotBase(canvas, xSquares, ySquares);
                let ctx = canvas.getContext("2d");
                ctx.fillStyle = "#000000";
                ctx.textAlign = "center";
                ctx.font = String(Math.min(canvas.width/this.xLim, canvas.height/this.yLim))+"px sans-serif";
                ctx.fillText("\u{2654}", canvas.width/this.xLim*(this.x+0.5), canvas.height/this.yLim*(this.y+0.875));
            }
        }
    }
}

class King extends Piece {
    // x: int, y: int, direction: int = 1, turns: int = 0, xLim: int = 8, yLim: int = 8, lxLim: int = 0, lyLim: int = 0 -> null
    constructor (x, y, direction = 1, turns = 0, xLim = 8, yLim = 8, lxLim = 0, lyLim = 0, colors = ["#FF00FF", "#00FFFF"]) {
        return super(x, y, "1*", direction, turns, xLim, yLim, lxLim, lyLim, colors);
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
            p.color = this.color;
            (direction==p1[0].direction?p1:p2).push(p);
            this.x = -1;
            this.y = -1;
        }
    }
}

/*
var p0 = new Piece(0, 0, "1>+, 2i>+, 1c>x"); // Test Move Coordinates
console.log(p0.move(0, 2));

var p1 = new Piece(0, 0, "nx", 1); // Test Attack Piece Coordinates
console.log(p1.attack(3, 3, [new Piece(3, 3, "", -1)]));

var p2 = new Piece(0, 0, "n*, n(~1/2)", 1); // Test Rider
console.log(p2.move(3, 6));

var p3 = new Piece(0, 0, "1x.n+", 1); // Test Then
console.log(p3.move(1, 3));

var p4 = new Piece(0, 0, "n(1x.2+)", 1); // Test Then in Rider
console.log(p4.move(2, 6));

var p5 = new Piece(0, 0, "n(~1/2).1*", 1); // Test Rider in Then
console.log(p5.move(3, 7));

var p6 = new Piece(0, 0, "n(1x.2+).n(~2*)", -1); // Test Then in Rider in Then
console.log(p6.move(6, 6));

var p7 = new Piece(3, 3, "cn(^2x), o1x", 1); // Test Hopper
console.log(p7.attack(5, 5, [new Piece(4, 4, "", -1), new Piece(6, 6, "", -1)]));
*/
