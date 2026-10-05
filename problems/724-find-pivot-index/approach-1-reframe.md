---
title: Move the split, don't re-add the sides
---

**1. Check every index by hand.** On [1, 7, 3, 6, 5, 6], index 3 has 1 + 7 + 3 = 11 on its left and 5 + 6 = 11 on its right. Adding both sides from scratch at every index works, but costs O(n) per index.

**2. Compare neighbouring indices.** Moving the split from index i − 1 to index i changes each side by one number: `nums[i - 1]` joins the left, and `nums[i]` leaves the right. Everything else stays where it was.

**3. What to carry: both sums.** Keep the left sum and the right sum, and update each by that one number per step. Before index 0, nothing is on the left and every number is on the right, so the left starts at 0 and the right at the total.

**4. Why every index is checked, in order.** The numbers can be negative, so neither sum grows steadily, and a balance at one index says nothing about the next. Scanning from the left makes the first balance found the leftmost pivot, which is the one asked for.

The reusable recipe: when a sum over a range changes by one element as the boundary moves, update it by that element instead of adding the range again.
