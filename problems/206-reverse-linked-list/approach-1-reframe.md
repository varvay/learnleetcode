---
title: Turn each arrow around
---

**1. Find what actually changes.** The nodes and their values stay where they are. Only the arrows flip: each `next` points to the node before it instead of the one after. The first node ends up pointing to `None`, and the last node becomes the head.

**2. Flip [1, 2, 3] by hand and find where one pass gets stuck.** At the 1, set `1.next = None`, since nothing comes before it. But `1.next` was the only way to reach the 2, so the rest of the list is lost. And at the 2, its arrow has to point back to the 1, which a singly linked list can't reach from the 2.

**3. Find what to remember.** Two things the flip would otherwise lose: the node just passed, `prev`, to point back to, and the rest of the list, `next_node`, saved before the arrow is overwritten.

**4. See the list as two parts.** At every step the nodes before `node` form a reversed list headed by `prev`, and the nodes from `node` on are still in their original order. Each turn moves one node from the front of the second part to the front of the first.

**5. Decide when to stop.** When `node` is `None`, every node has been moved, and `prev` is the head of the reversed list.

**6. Check the cost.** Each node is flipped once: O(n) time, and three pointers: O(1) space.

The reusable recipe: when an in-place update overwrites the only link to what comes next, save that link first. To reverse a chain, carry the node just passed.
