---
title: Three cases, and only one is hard
---

**1. Restate the job.** Find the node holding `key`, remove it, and return a root of a tree that is still a binary search tree: everything left of a node smaller, everything right larger. If `key` is absent, the tree is returned unchanged.

**2. Find the node the way 700 does.** Compare `key` with each node and step to the only side that can hold it. That is O(h), and the walk also passes the parent, whose link is the one that has to change.

**3. Sort the removals by children.** A leaf just disappears: its parent's link becomes `None`. A node with one child is replaced by that child: the child's whole subtree already sits on the correct side of the parent, so the ordering survives. Those two are one-line rewirings.

**4. Find what the two-child case needs.** Removing a node with two subtrees leaves both of them without a parent, and only one can take the node's place. Something has to sit between them: a value larger than everything on the left and smaller than everything on the right.

**5. Two ways to fill the gap.** `solution-1-original.py` puts the left subtree in the node's place and hangs the right subtree under the left's largest node, which is valid because every right key is larger. `solution-2-successor.py` copies in the in-order successor, the smallest key of the right subtree, then deletes that successor from the right subtree. The successor has no left child, so that second deletion is always the easy case. The first stacks one subtree under the other and makes the tree taller; the second leaves the shape alone. The explainer below shows the difference.

**6. Check the cost.** Both walk down at most twice: O(h) time. `solution-1-original.py` loops in O(1) space; the recursive successor version uses O(h) calls.

The reusable recipe: when removing a node with two children from an ordered tree, replace it with its in-order neighbor, which has at most one child, and delete that neighbor instead.
