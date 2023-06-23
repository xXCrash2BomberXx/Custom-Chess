# Basic-Chess

A basic chess program written in HTML and Typescript where pieces can be modified using [Parlett's Movement System](https://en.m.wikipedia.org/wiki/Fairy_chess_piece#0%E2%80%939)

<details>

<summary>Recommended Parlett's Order</summary>

\<conditions> \<move type> \<distance> \<direction> \<other>

</details>

<details>

<summary>Move Commands</summary>

* '1', '2', '3', ..., 'n'/'N' = Distance of N
* '*' = Orthogonal of Diagonal Movement
* '+' = Orthogonal Movement
* '>' = Forwards Movement
* '<' = Backwards Movement
* '<>' = Forwards or Backwards Movement
* '=' = Orthogonally Sideways Movement
* '>=' = Orthogonally Forwards or Sideways Movement
* '<=' = Orthogonally Backwards or Sideways Movement
* 'x'/'X' = Diagonal Movement
* 'x>'/'X>' = Diagonally Forward Movement
* 'x<'/'X<' = Diagonally Backward Movement
* '+>' = Orthogonally Forward Movement
* '+<' = Orthogonally Backward Movement
* 'X/Y' = Distance of X and Y in Different Orthogonal Directions
* 'i'/'I' = Only Use on First Movement of Piece
* 'c'/'C' = Only Use on Capturing Piece (Only applies to final square being landed on)
* 'o'/'O' = Only Use on Not Capturing Piece
* ',' = Add Different Movements to a Piece
* 'k'/'K' = King flag that enables notifications when placed into check by another piece

</details>