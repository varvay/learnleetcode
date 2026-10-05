---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Top-down recursion (`solution-1-top-down.py`) | O(n) | O(h) | Pass the depth so far to each child; each empty child returns the depth it reached. |
| **Bottom-up recursion** (chosen, `solution-2-bottom-up.py`) | **O(n)** | **O(h)** | Each node returns 1 plus the larger of its children's depths. |
| Explicit stack of (node, depth) pairs (`solution-3-stack.py`) | O(n) | O(h) | Iterative depth-first search: pop a pair, update the deepest depth seen, and push the children one level deeper. |
| Breadth-first search, counting levels | O(n) | O(w) | Take the tree one level at a time with a queue; the number of levels is the depth. w is the widest level. |

Both recursions make one call per level, and Python stops at 1,000 calls by default: on a chain of 10,000 nodes, the largest tree the problem allows, both raised `RecursionError` when run locally. The explicit stack has no such limit: `solution-3-stack.py` returned 10,000 on the same chain.

The explicit stack has to carry what the recursion kept for free. A call knows its depth from its own parameter or return value, but a node popped off a stack carries nothing, so each entry is a `(node, depth)` pair and every child is pushed one level deeper than its parent.
