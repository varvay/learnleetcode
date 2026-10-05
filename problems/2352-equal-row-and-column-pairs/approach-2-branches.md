---
title: Let the variables' meanings write the loop
---

| Variable | Always means |
| --- | --- |
| `token` | one row or column, its numbers joined with `_` |
| `rows` | each token mapped to how many rows read so far have it |
| `cols` | each token mapped to how many columns read so far have it |

| Code | What happened | What it restores |
| --- | --- | --- |
| `token = "_".join(... self.row(grid, i))` | row `i` is read | its sequence becomes one key |
| `if token not in rows: rows[token] = 1`, `else: rows[token] += 1` | a row with this token | `rows` counts it, first sighting or repeat |
| the same lines with `self.col` and `cols` | column `i` is read | `cols` counts it |
| `sum(rows[token] * cols[token] for token in rows if token in cols)` | both dicts are complete | each token adds its pairs; a token with no column is skipped, a token with no row is never visited |

Rows and columns are counted in the same loop because the grid is square: index `i` reaches row `i` and column `i` together.

The method carries over: keep one count per group, so the two numbers a pair needs stay apart until the multiplication.
