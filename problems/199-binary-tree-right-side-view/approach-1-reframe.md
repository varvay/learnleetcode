---
title: Make the rightmost node the first one found
---

**1. Restate what is seen.** Looking at the tree from the right, each depth shows exactly one node: the rightmost node at that depth. The answer lists them from the top down.

**2. Try the obvious walk and find where it fails.** Following right children from the root gives the right edge of the tree. On [1, 2, 3, 4] that is 1, 3, and stops, but the view is 1, 3, 4: the 4 hangs under the left child 2, yet nothing at its depth sits further right, so it is seen. Every depth needs checking, not just the right edge.

**3. Walk depth by depth.** Breadth-first search takes the tree one level at a time, so it meets every node at every depth. What it must keep is one node per depth: the rightmost.

**4. Order the walk so the rightmost comes first.** Push each node's right child before its left. A level then leaves the queue from right to left, so the first child found at the next depth belongs to the rightmost parent that has a child, and it is the right child when there is one: exactly the rightmost node at that depth. Keeping the first node found per depth, with `setdefault`, keeps the view.

**5. Read the answer in depth order.** A Python dict keeps insertion order, and each depth is first inserted only after the one above it, so `result.values()` runs from the top down.

**6. Check the cost.** Each node is queued once: O(n) time. The queue holds at most about two levels at a time, O(w) for the widest level, and `result` holds one entry per depth.

The reusable recipe: when you need one extreme node per level, order the walk so that extreme is found first, then keep only the first node found at each depth.
