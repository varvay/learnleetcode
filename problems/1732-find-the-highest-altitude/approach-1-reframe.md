---
title: Carry only what the next step needs
---

**1. Work out the altitudes by hand.** On [-5, 1, 5, 0, -7], the biker starts at 0, then reaches -5, -4, 1, 1, -6. Each altitude is the one before it plus a gain: the altitudes are running sums of `gain`, with point 0 in front.

**2. Ask what each step needs from the past.** To get the next altitude, only the current one is needed, not the whole list. To answer the question, only the highest seen so far is needed. So two numbers carry everything: the current altitude and the highest one.

**3. Decide where they start.** Both start at 0, because point 0 is a real point at altitude 0. When every later point is lower, as in [-4, -3, -2, -1, 4, 3, 2], the start itself is the highest point and the answer is 0.

The reusable recipe: when each value is built from the one before it and the answer is the largest of them, carry the running value and the running best through one loop; the list of values is never stored.
