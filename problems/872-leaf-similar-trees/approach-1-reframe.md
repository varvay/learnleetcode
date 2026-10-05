---
title: Walk both trees in step, one leaf at a time
---

**1. Restate what is compared.** Only the leaves count, read left to right. Two trees of different shapes are leaf-similar when those sequences are equal.

**2. Compare LeetCode's first example by hand and find where the obvious way wastes memory.** The trees have different shapes, but both have the leaves 6, 7, 4, 9, 8 in that order. The obvious way collects each tree's leaves into a list and compares the lists. That stores every leaf of both trees, yet the comparison only ever looks at one pair at a time.

**3. Find what to remember instead.** Where each walk has got to, so it can be paused after a leaf and resumed for the next. A plain recursive function can't hand back one leaf and resume later, but an explicit stack can: the stack is the walk's place. One stack per tree, and the two walks take turns.

**4. Make each walk reach its leaves left to right.** A depth-first walk that pushes the right child before the left pops the left first, so it reaches leaves in left-to-right order.

**5. Step the walks together.** Every time tree 1's walk reaches a leaf, advance tree 2's walk to its next leaf and compare the two. A mismatch, or tree 2 running out first, settles it as `False`. When tree 1 is done, tree 2 must have no leaves left either.

**6. Check the cost.** Each node is pushed and popped once: O(n₁ + n₂) time. Each stack holds only the pending right children along one path, O(h₁ + h₂) space, and the walk stops at the first mismatch.

The reusable recipe: to compare the sequences two walks produce, keep each walk's own stack and advance them in turn, comparing as you go. Memory then follows the walks' depth, not the sequences' length.
