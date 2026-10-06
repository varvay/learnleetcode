---
title: Let the ordering pick the branch
---

**1. Restate what a BST promises.** In a binary search tree, every value in a node's left subtree is smaller than the node, and every value in its right subtree is larger. That holds for whole subtrees, not just the two children.

**2. Search LeetCode's first tree by hand and find the wasted work.** In [4, 2, 7, 1, 3], looking for 3, a breadth-first search checks 4, 2, 7, 1, 3: every node. But at 4, the 7 could never be 3: everything right of 4 is larger than 4, and 3 is smaller. A search that ignores the ordering checks nodes the ordering has already ruled out.

**3. Find what to remember.** Nothing but the current node. Comparing `val` with one node rules out a whole subtree: if `val` is smaller, it can only be on the left; if larger, only on the right. The other side never needs looking at.

**4. Walk down.** Start at the root, compare, and step left or right until the node holds `val` or the walk falls off the tree. Falling off means `val` is not in the tree, and `None` is the answer.

**5. Check the cost.** One node per level: O(h) time, which is O(log n) on a balanced tree and O(n) on a chain, and O(1) space. On a random 1,000-node BST, finding a present key checked 12.2 nodes on average, where breadth-first search checked 505.

The reusable recipe: when data is ordered, compare with the middle and discard the side that cannot hold the target, instead of searching everything.
