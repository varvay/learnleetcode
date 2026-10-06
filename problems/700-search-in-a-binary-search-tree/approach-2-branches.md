---
title: Let the one remaining subtree write the loop
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `node` | the root of the only subtree that can still hold `val`, or `None` when no subtree can |

| Code | What it means | What it keeps true |
| --- | --- | --- |
| `node = root` | the whole tree can hold `val` | an empty tree starts as `None`, so the loop never runs |
| `if node.val == val: return node` | found | the subtree rooted here is the answer |
| `node = node.left if val < node.val else node.right` | everything right of `node` is larger and everything left is smaller, so only one side can hold `val` | `node` is again the only subtree that can |
| `return None` | the walk fell off the tree | `val` is absent |

The three files show how this loop was reached:

- `solution-1-original.py` checks every node level by level. It is a correct search for any binary tree, but never reads the ordering, so it pays O(n) time and O(w) queue space.
- `solution-2-ordered-queue.py` reads the ordering: each node queues only the one child that can hold `val`. The queue then never holds more than one node, since each node adds at most one child and leaves before the next is added, so it is a single pointer in disguise.
- `solution-3-walk.py` makes that pointer explicit: one variable, O(h) time, O(1) space.

The method carries over: say what the one variable means, and each comparison either finishes or moves it to the only place the answer can still be.
