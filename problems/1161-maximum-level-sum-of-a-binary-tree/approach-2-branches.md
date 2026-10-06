---
title: Let the running sum's meaning write the branches
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `queue` | `(node, level)` pairs in breadth-first order: the rest of one level, then the start of the next |
| `temp_sum` | the sum of the nodes already taken on the current level |
| `best`, `result` | the largest closed level sum so far, and the smallest level that has it |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `queue, best, result = deque([(root, 1)]), root.val-1, 1` | nothing is summed yet | `best` sits below level 1's sum, so level 1 is taken first |
| `queue.append((child, level+1))` | the node's children are found | each child carries its level |
| `if not queue or queue[0][1] != level:` | the next node is on another level, or there is none | `current` is the last node of its level |
| `temp_sum += current.val`, then the comparison | the level is complete | a strictly larger sum takes over, so ties keep the earlier level |
| `temp_sum = 0` | the next level starts | the running sum describes the new level |
| `else: temp_sum += current.val` | more of this level is coming | the running sum grows |

Both branches add `current.val`, so the addition can move above the `if` and the `else` disappears. The `if not root` guard never runs, since LeetCode guarantees at least one node.

The method carries over: say what the running total covers, and close it exactly when that description stops being true.
