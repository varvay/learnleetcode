---
title: Alternatives compared
---

| Approach | Time | Space | Height after many deletions | How it works |
| --- | --- | --- | --- | --- |
| Hang the right subtree under the left's maximum (`solution-1-original.py`) | O(h) | O(1) | grows | Put the left subtree in the node's place; attach the right subtree to the left's rightmost node. |
| **Copy the in-order successor** (chosen, `solution-2-successor.py`) | **O(h)** | **O(h)** | stays | Copy the right subtree's minimum into the node, then delete that minimum. |
| Copy the in-order predecessor | O(h) | O(h) | stays | The mirror image, with the left subtree's maximum. |
| Successor, iterative | O(h) | O(1) | stays | The same moves with an explicit parent pointer instead of recursion. |

Measured locally on a random 2,000-node BST of height 27, deleting 1,000 random keys left the tree 119 levels tall with the first strategy and 23 with the successor. Every later search, insert or delete costs O(h), so the height is what the two-child strategy really decides.

The recursive successor version makes one call per level: a tree can have 10,000 nodes, and on a chain that long it raised `RecursionError` under Python's default limit when run locally. `solution-1-original.py` and the iterative successor have no such limit.
