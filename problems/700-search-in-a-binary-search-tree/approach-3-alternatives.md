---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Breadth-first search over every node (`solution-1-original.py`) | O(n) | O(w) | Check nodes level by level until one matches; correct for any binary tree, ordered or not. |
| A queue that follows the ordering (`solution-2-ordered-queue.py`) | O(h) | O(1) | Queue only the child that can hold `val`; the queue never holds more than one node. |
| Recursion following the order | O(h) | O(h) | Return the node if it matches, otherwise recurse into the one side that can hold `val`. |
| **Walk down the order** (chosen, `solution-3-walk.py`) | **O(h)** | **O(1)** | One pointer: return it on a match, otherwise move it to the side that can hold `val`. |

Every version that reads the ordering checks one node per level. Measured locally on a random 1,000-node BST, finding a present key checked 505 nodes on average with breadth-first search over every node, and about 12 with the ordered versions.
