---
title: Stop one node before the middle
---

**1. Find what a deletion needs.** A singly linked list removes a node by rewiring the node before it: `before.next = before.next.next`. The middle is at index n // 2, so the walk has to stop at index n // 2 − 1.

**2. Walk it by hand and find where one pass gets stuck.** On [1, 3, 4, 7, 1, 2, 6], n = 7, so the middle is index 3, the 7, and the walk must stop at index 2, the 4. But n is known only at the end of the list, and by then index 2 is behind, with no way back. Counting first and walking again takes two passes.

**3. Find what to remember instead.** The middle of the nodes seen so far. After k nodes it sits at index k // 2, so it moves one step for every two nodes the walk covers. When the walk reaches the end, that pointer is at the middle of the whole list.

**4. Let two speeds do the counting.** "One step for every two" is two pointers: `fast` moves two nodes per turn and `slow` one. Starting `fast` two nodes ahead keeps `slow` one node behind the middle, which is exactly where step 1 needs it.

**5. Handle the list with no node before the middle.** With one node, the middle is the head itself, and deleting it leaves an empty list: return `None`. Every longer list has a node before its middle.

**6. Check the cost.** One pass of about n/2 turns, and two pointers: O(n) time, O(1) space.

The reusable recipe: to reach a fixed fraction of a list's length in one pass, move two pointers at speeds in that ratio. To delete a node, stop on the one before it.
