# P2P-Custom-Chess

A [P2P Custom Chess](https://chessplus.xxcrashbomberxx.freecluster.eu/) program written in HTML and Typescript where pieces can be modified using [Parlett's Movement System](https://en.m.wikipedia.org/wiki/Fairy_chess_piece#0%E2%80%939)

<details>

<summary>Recommended Parlett's Order</summary>

\<conditions> \<move type> \<distance> \<direction> \<other>

</details>

<details>

<summary>Move Commands</summary>

* '1', '2', '3', ..., 'n'/'N' = Distance of N
* 'X-Y' = Distance in Inclusive Range from X to Y
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
* 'W-X/Y-Z' = Distance in Inclusive Range from W to X and Y to Z in Different Orthogonal Directions
* 'X/Ys'/'X/YS' = Strict Distance of X Horizontally and then Y Vertically in Different Orthogonal Directions
* 'W-X/Y-Zs'/'W-X/Y-ZS' = Strict Distance in Inclusive Range from W to X Horizontally and then Y to Z Vertically in Different Orthogonal Directions
* '~' = Jumping Operator (Knights)
*'i'/'I' = Only Use on First Movement of Piece
* 'c'/'C' = Only Use on Capturing Piece (Only applies to final square being landed on)
* 'o'/'O' = Only Use on Not Capturing Piece
* ',' = Add Different Movements to a Piece
* '-' = Inclusive Range Operator
* 'r'/'R' = Right (Relative to Direction 1)
* 'l'/'L' = Left (Relative to Direction 1)
* 'd'/'D' = Cannot be Killed nor Moved
* '()' = Grouping Operator (Nightriders) (Use 'n()' instead of the deprecated '&' operator)
* '.' = Then Operator (Aanca)
* '^' = Locust Operator (Checkers) (Must capture between each jump)
* 'k'/'K' = King flag that enables notifications when placed into check by another piece

</details>

<details>

<summary>How to Connect</summary>

1. Have Player 1 Click the `Connect` button.
2. Send the Game ID generated in the box to Player 2.
3. Have Player 2 enter the Game ID into their box.
4. Have Player 2 Click the `Connect` button.

Upon connection, both players should get an alert that a player has connected. Any Piece changes will be reflected onto both sides with the person who is receiving the changes getting an alert describing the change made.

</details>
