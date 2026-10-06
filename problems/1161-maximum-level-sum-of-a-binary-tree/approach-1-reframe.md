---
title: Close a level when the next node belongs to another
---

**1. Restate the answer.** Sum the values on each level, numbering the root's level 1, and return the level with the largest sum. On a tie, the smallest level wins.

**2. Sum LeetCode's first example by hand and find where one queue gets stuck.** In [1, 7, 0, 7, -8], the levels sum to 1, 7 + 0 = 7, and 7 + (−8) = −1, so the answer is level 2. A breadth-first queue visits nodes level by level, but it is one long line: nothing in it says where one level ends and the next begins, and a level's sum can only be judged once the level is complete.

**3. Tag each node with its level.** Push `(node, level)`, and every child gets its parent's level + 1. Now each node carries its level, and the sum can run for the current level.

**4. Detect the end of a level by peeking.** The children of the node just taken are already appended, so `queue[0]` is the next node to come out. If the queue is empty, or `queue[0]` is on a different level, the node just taken was the last of its level: close the sum, compare it with the best, and reset.

**5. Settle ties and negative sums.** `best` starts at `root.val - 1`, below level 1's sum, so level 1 is always taken first, even when every sum is negative. The comparison is a strict `>`, so a later level with an equal sum never replaces an earlier one, and the smallest level wins the tie.

**6. Check the cost.** Each node is queued once: O(n) time, and O(w) for the widest level in the queue.

The reusable recipe: to process a breadth-first walk group by group without counting, tag each item with its group and close a group when the next item belongs to another.
