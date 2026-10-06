---
title: Let the queue's order write the lines
---

| Variable | Always means |
| --- | --- |
| `queue` | `(node, depth)` pairs found but not yet expanded, in the order found; within a level, right to left |
| `result` | for each depth found so far, the first node found there, which is its rightmost |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `queue, result = deque([(root, 0)]), {0: root}` | depth 0 holds only the root | the root is its own level's view |
| `current, depth = queue.popleft()` | the next node, right to left within its level | |
| `queue.append((current.right, depth+1))` first | the right child is found before its sibling | the next level is queued right to left too |
| `result.setdefault(depth+1, child)` | a child at `depth + 1` is found | the first one found at a depth stays; later, more-leftward ones are ignored |
| `return [node.val for node in result.values()]` | the queue is empty | one value per depth, top to bottom |

The order of the two `if` blocks is the whole trick. Swap them, pushing the left child first, and the first node found at each depth becomes the leftmost: on [1, 2, 3, null, 5, null, 4] the same code then returns the left side view, [1, 2, 5], instead of [1, 3, 4].

The method carries over: decide which node of each group should be found first, then order the pushes so that it is.
