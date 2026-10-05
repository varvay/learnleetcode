---
title: On a binary tree, one level at a time
---

A tree is a graph with no cycles, so every node is found exactly once, from its parent. A LeetCode binary tree stores only `left` and `right` children, so the visited set goes away: append the children that exist, and the queue never sees a node twice.

Tree problems often want the nodes grouped by level, such as level-order traversal or a tree's depth. When a round of the loop starts, the queue holds exactly one whole level: every node at that depth, and nothing deeper. So `for _ in range(len(queue))` takes exactly that level, while the children it appends wait behind for the next round. That is `bfs_tree.py`; on the tree 1, with children 2 and 3, each with two children, it returns `[[1], [2, 3], [4, 5, 6, 7]]`.

The reusable recipe: to work a tree level by level, read the queue's length at the start of each round, and take exactly that many nodes.
