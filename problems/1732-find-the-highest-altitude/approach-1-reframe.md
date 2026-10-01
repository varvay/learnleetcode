---
title: Altitudes are running sums
---

Each gain is the change from one point to the next, so the altitude at a point is the sum of every gain before it. The altitudes are the prefix sums of `gain`, with point 0 at altitude 0 in front. The answer is the largest of them.

Point 0 counts. When every later point is lower, the start is the highest point and the answer is 0, so the running maximum starts at 0 rather than at the first altitude.

Each altitude is needed only to compute the next one and to compare with the maximum. One pass carrying both numbers is enough; the list of altitudes is never stored.
