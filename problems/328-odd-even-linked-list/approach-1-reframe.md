---
title: Two chains grown side by side
---

**1. Restate what moves.** Positions decide the order, not values: positions 1, 3, 5, … first, then 2, 4, 6, …, each group in its original order. With O(1) extra space, the nodes have to be relinked where they are, not copied.

**2. Sort [1, 2, 3, 4, 5] by hand and find where one pass gets stuck.** Walking left to right, each node joins one of two chains: 1, 3, 5 to the odd chain, 2, 4 to the even chain. But the even chain goes after the whole odd chain, and its first node, the 2, was passed near the start. By the time the odd chain is done, the walk can't go back for it.

**3. Find what to remember.** The head of the even chain, `even_start`, so it can be attached at the end. And the tail of each chain, since that is where its next node is added. The odd chain's head is `head` itself.

**4. See where each chain's next node is.** The positions alternate, so the node right after the even tail is the next odd node, and the node right after the new odd tail is the next even node. Two tail pointers, each one step ahead of the other, are all the walk needs.

**5. Join the chains at the end.** When the nodes run out, link the odd tail to `even_start`. The even tail already points to `None`, because it was copied from the end of the list.

**6. Check the cost.** Each node is relinked once: O(n) time, and three pointers: O(1) space.

The reusable recipe: to split a list into interleaved groups in place, keep a tail pointer per group and give each node to the group whose turn it is. Remember the head of every group but the first, to stitch them together at the end.
