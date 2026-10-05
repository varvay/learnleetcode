---
title: Build a node's depth from its children's
---

**1. Restate the answer.** The depth is the number of nodes on the longest path from the root down to a leaf.

**2. Measure [3, 9, 20, null, null, 15, 7] by hand and find where one pass gets stuck.** The root-to-leaf paths are 3–9 with 2 nodes, and 3–20–15 and 3–20–7 with 3 each, so the depth is 3. But standing at the root, there is no telling which branch runs longest: each one has to be walked to its end.

**3. Find what to remember.** For each subtree, its depth. A tree's depth is 1 for its root plus the depth of its deeper subtree, and an empty tree's depth is 0. The question about the whole tree is the same question about each subtree, so it is a recursion.

**4. Let the dependency pick the order.** A node's answer needs both its children's answers first, so each call walks a whole subtree before it can return. That is depth-first search, in postorder: the node's own work happens after both subtrees. The call stack holds the path from the root to the node being worked on.

**5. Or carry the depth down instead.** `solution-1-top-down.py` passes the depth so far to each child, and every empty child returns the depth it reached; the largest of those is the answer. It is the same walk, with the information flowing down as parameters instead of up as return values.

**6. Check the cost.** Every node is visited once: O(n) time. The call stack is as deep as the tree is tall, O(h), which is n for a tree that is one long chain.

The reusable recipe: when a node's answer is built from its children's answers, recurse into the children first and combine their results on the way back up.
