# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Klondike solitaire engine plus a solver/simulator for its move-selection heuristic. There is no build system, package.json, linter or test suite — everything is plain JS in global scope.

## Running

`solitaire.html` is a single self-contained file (inline `<script>`). Open it in a browser: it deals a hand, shows one button per legal move (clicking plays it), and a "New deal" button. Display is scaled via `zoom` on `body`.

The Node modes live in `lvs.js` (`node lvs.js`): with no args it plays 1,000,000 random deals with the automatic `step()` strategy and prints average score, win rate and score distribution; with any extra argv (e.g. `node lvs.js x`) it steps one move per keypress, printing the table and rewriting `table.html` (auto-refreshing) for viewing in a browser. `solitaire.html` still contains those Node branches (guarded by `typeof process`) but Node cannot run it directly.

`lvs.js` is the standalone Node version of the same engine; `solitaire1.html`/`solitaire2.html` are older pages that load it via `<script src>`. The `* copy*` files and `solitaire.zip` are untracked backups. `solitaire.html` is the current one — edit it, not the others.

## Architecture

Game state is global arrays: `stock`, `waste`, `build[0..6]`, `suits[0..3]`. A card is `{r: rank 1–13, s: suit 0–3, u: faceUp}`. Piles are stored **top-card-first** (index 0 is the exposed card; for build columns the face-up run is at the front). Suit order is `h c d s`; images live in `cards/individuals/<suit>/…` plus a `card back`, referenced from the `cardImages` map and rendered by `showHTML`/`cardDisplayHTML`.

Move logic is a generate-then-pick design:
- `possibleMoves()` enumerates every legal move as a `Move(moveType, fromPile, toPile, cardIndex)` using the `Move*` type constants (build↔suits, waste→build, build→build, turn stock, and "Expose" variants that uncover a face-down card). It returns them **already priority-ordered**; the order encodes the heuristic (helpers `order`, `numdown`, `numgap` sort build columns by face-down count / gaps).
- `doMove(m)` applies a move; `step()` plays `moves[0]` and returns 1, or 0 if no moves remain.
- `result()` scores a finished hand as the sum of the top rank in each suit pile (52 = win).

Changing the heuristic means changing the ordering inside `possibleMoves()`; use the 1M-game simulation output (win rate) to compare changes. In browser mode the UI reuses `possibleMoves()`/`doMove()` directly, with `moveLabel()` naming each button.
