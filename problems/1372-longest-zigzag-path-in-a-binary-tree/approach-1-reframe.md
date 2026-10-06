---
title: Carry two zigzags down, one per next turn
---

**1. Restate the length.** A zigzag path moves down the tree, alternating left and right at every step, and its length counts edges. It can start at any node, in either direction.

**2. Try it by hand and find the repeated work.** The direct way starts at every node, once going left and once going right, and walks until the alternation breaks. A node deep in a long zigzag is re-walked by every start above it on that zigzag, so the work piles up to O(n · h).

**3. Find what a node needs from its parent.** A zigzag reaching a node arrived by one move, so its next move is fixed: arriving by a right move, it continues only by going left. So two numbers describe everything that reaches a node: the longest zigzag ending here that would continue by going left, and the one that would continue by going right. In `solution.py` these are `left` and `right`, named for the next move.

**4. Derive the child's numbers from the parent's.** Stepping to the right child is a right move, so it extends the zigzag that wanted a right turn: the child's `left` is the parent's `right` + 1, and the child's `right` is 0, since nothing arrives at a right child by a left move. Stepping left is the mirror image. A brand-new zigzag starting at the parent needs no special case: when the parent's number is 0, + 1 gives the one-edge path.

**5. Take the best anywhere.** Every node's two numbers are lengths of real zigzags, so the answer is the largest number seen at any node.

**6. Check the cost.** Each node is pushed and popped once: O(n) time. The stack holds pending siblings along one path, O(h).

The reusable recipe: when a path's next step depends on its last one, carry one running length per possible next step, and let each move extend the one it continues and restart the others.
