---
title: On a binary tree
---

A tree is a graph with no cycles, so every node is reached by exactly one path, from its parent. In the explainer's tree example, the graph lists each parent as a neighbor, and the parent is the only neighbor `visited` ever skips.

A binary tree in LeetCode stores only `left` and `right` children, so the walk can never step back to a parent, and the visited set goes away. The recursion is three lines: take the node, walk its left subtree, walk its right subtree. That is `dfs_tree.py`.

Where the node's own work goes names the order:

| Order | The node is handled | On 1 with children 2, 3, and 2 with children 4, 5 |
| --- | --- | --- |
| preorder | before both subtrees | 1, 2, 4, 5, 3 |
| inorder | between the subtrees | 4, 2, 5, 1, 3 |
| postorder | after both subtrees | 4, 5, 2, 3, 1 |

Postorder is what a depth or a subtree sum needs: a node's answer is built from its children's answers, which are ready only once both subtrees are done.

The reusable recipe: on a tree, drop the visited set and recurse into the children, and choose pre-, in- or postorder by when the node's own work can happen.
