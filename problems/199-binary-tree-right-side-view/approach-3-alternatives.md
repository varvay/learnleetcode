---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Follow right children only | O(h) | O(1) | Wrong: it misses deeper nodes in left subtrees, giving [1, 3] instead of [1, 3, 4] on [1, 2, 3, 4]. |
| Level by level, keep the last | O(n) | O(w) | Breadth-first search one level per round with `for _ in range(len(queue))`, pushing left then right, and keep each round's last node. |
| **First found per depth, right child first** (chosen, `solution.py`) | **O(n)** | **O(w)** | One breadth-first pass pushing right before left; `setdefault` keeps the first node found at each depth. |
| Depth-first, right child first | O(n) | O(h) | Visit right before left and append a node's value when `depth == len(result)`, the first node reached at that depth. |

All three correct versions rely on the same idea: walk so that the rightmost node of each depth is reached first, or last, and keep exactly that one. The depth-first version needs only O(h) space, where breadth-first holds a whole level; on a wide, shallow tree that is the difference.
