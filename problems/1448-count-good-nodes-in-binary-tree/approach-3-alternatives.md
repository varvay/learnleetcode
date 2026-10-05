---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Check each node against its whole path | O(n · h) | O(h) | Keep the path on a list and compare each node with every value on it. |
| Recursion passing the maximum down | O(n) | O(h) | `visit(node, best)` counts the node if `node.val >= best`, then visits both children with `max(best, node.val)`. |
| **Stack of (node, path maximum)** (chosen, `solution.py`) | **O(n)** | **O(h)** | Push each child with its path's maximum; a popped node is good when it equals that maximum. |
| Queue of (node, path maximum) | O(n) | O(w) | The same pairs taken level by level with breadth-first search; w is the widest level. |

Every approach that carries the maximum does the same O(1) check per node; they differ only in what holds the pairs. A tree can have 100,000 nodes, so a chain that deep exceeds Python's default limit of 1,000 recursive calls, while the stack has no such limit: `solution.py` ran a 100,000-node chain when run locally.
