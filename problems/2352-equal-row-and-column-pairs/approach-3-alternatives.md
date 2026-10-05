---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Brute force | O(n³) | O(1) | Compare every row with every column, number by number. |
| **Two dicts of tokens** (chosen) | **O(n²)** | **O(n²)** | Count rows and columns by token, then add `rows × cols` for each token. |
| One dict, looked up by column | O(n²) | O(n²) | Count the rows only; each column then adds `rows[token]`, the number of rows equal to it. |
| Tuple keys | O(n²) | O(n²) | `tuple(row)` is hashable, so it can be the key directly, without building a string. |

Reading the grid alone takes n² steps, so O(n²) is the best possible. The one-dict version adds the same `rows × cols` total one column at a time: a token's `rows` count gets added once per matching column.
