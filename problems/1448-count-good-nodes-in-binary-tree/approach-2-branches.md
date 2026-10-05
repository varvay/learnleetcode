---
title: Let the pair's meaning write each line
---

| Variable | Always means |
| --- | --- |
| `(current, best)` on the stack | `best` is the largest value on the path from the root down to `current`, `current` included |
| `solution` | how many of the nodes popped so far are good |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `stack, solution = [(root, root.val)], 0` | the path to the root is the root alone | its largest value is its own |
| `current, best = stack.pop()` | the next node and its path's maximum come off | |
| `stack.append((child, max(best, child.val)))` | a child's path is this path plus the child | its maximum is the larger of the two |
| `if current.val >= best: solution += 1` | `best` already includes `current`, so this is `current.val == best` | the node is good exactly when nothing on its path is larger |
| `return solution` | the stack is empty | every node has been checked |

The test needs `>=`, not `>`: a node equal to the largest value above it is still good, like the 3 under 3 → 1 in LeetCode's first example.

The method carries over: put next to each node on the stack exactly what its check needs, and derive the child's value from the parent's.
