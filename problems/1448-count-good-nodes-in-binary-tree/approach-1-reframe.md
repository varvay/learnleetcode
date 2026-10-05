---
title: Carry the path's maximum down
---

**1. Restate what makes a node good.** No node on the path from the root down to it holds a larger value. Equivalently, its value is at least the largest value above it.

**2. Count LeetCode's first example by hand and find where it gets slow.** In [3, 1, 4, 3, null, 1, 5], the good nodes are the root 3, the 4 under it, the 3 on the path 3 → 1 → 3, and the 5 on 3 → 4 → 5: four in all. The two 1s are not. Checking each node against its whole path works, but it re-reads the path for every node: O(h) work per node.

**3. Find what to remember.** Not the whole path, just its largest value. A child's path is its parent's path plus the child itself, so the child's maximum is `max(parent's maximum, child's value)`: one number, handed down from parent to child.

**4. Let any depth-first walk carry it.** Push each node together with its path's maximum, as `(node, best)` pairs on a stack, the same way 104 carries `(node, depth)`. Each node only needs its own path, so the order of the walk doesn't matter.

**5. Read the test against what `best` holds.** In `solution.py`, a child is pushed with `max(best, child.val)`, so `best` includes the node itself and is never below `current.val`. The test `current.val >= best` therefore holds exactly when the node is its path's largest value, ties included. Pushing children with `max(best, current.val)` and starting the root at negative infinity carries the ancestors' maximum only, so that the test reads exactly like the definition.

**6. Check the cost.** Each node is pushed and popped once: O(n) time, and O(h) space for the stack.

The reusable recipe: when a node's answer depends on its ancestors, pass a summary of the path down with each node, such as a running maximum, instead of the path itself.
