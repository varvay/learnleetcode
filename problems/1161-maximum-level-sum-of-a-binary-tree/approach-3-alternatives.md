---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Level by level with a count | O(n) | O(w) | Breadth-first search with `for _ in range(len(queue))`: each round takes exactly one level, so its sum is complete when the round ends. |
| **Level tags and a peek** (chosen, `solution.py`) | **O(n)** | **O(w)** | Each queue entry carries its level; a level closes when the next entry belongs to another. |
| Depth-first with a sum per depth | O(n) | O(h + levels) | Walk the tree in any order, adding each value to `sums[depth]`; then pick the first index of the maximum. |

The breadth-first versions close each level as soon as it is complete. The depth-first one keeps every level's sum until the end, which needs a list as long as the tree is tall but no queue.
