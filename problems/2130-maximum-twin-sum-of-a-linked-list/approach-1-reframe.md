---
title: Fold the list in half
---

**1. Restate the pairs.** Node i's twin is node n − 1 − i: the first node with the last, the second with the second-to-last. Folding the list in half lines every node up with its twin.

**2. Pair [5, 4, 2, 1] by hand and find where one pass gets stuck.** The twins are (5, 1) and (4, 2). Walking forward, the 5's twin is the last node, reached only at the end, and by then the 5 is far behind with no way back.

**3. Find what to remember.** One half has to be read backwards while the other is read forwards. Last in, first out is a stack: push the second half's values, then pop them while walking from the head, so the last node meets the first, as in `solution-2-stack.py`. A full copy read from both ends works too, as in `solution-1-original.py`. Either way it costs O(n) space.

**4. Remove the storage by reordering the second half.** The list itself can be made to read in the order the pairs need. Find the middle with fast and slow pointers (as in 2095), reverse the second half in place (as in 206), then walk the first half and the reversed second half side by side: each step meets one pair of twins.

**5. Check the cost.** Three passes over at most n nodes: O(n) time, and a few pointers: O(1) space. The input list is left rewired.

The reusable recipe: when a sequence is matched against its own reverse, either store one half on a stack, or reverse one half in place and walk both halves forward together.
