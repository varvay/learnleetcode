---
title: Only right then left collides
---

Two asteroids meet only when the one on the left moves right and the one on the right moves left. Every other combination moves apart or in the same direction, so it never collides.

Read left to right, keeping the survivors so far. A right-mover can't hit anything yet, so it is kept. A left-mover can only hit the right-movers kept just before it, nearest first: last kept, first hit. That is a stack, and the left-mover works down from its top. It destroys each smaller right-mover it meets, until one of three things happens:

- it meets an equal right-mover, and both explode;
- it meets a bigger right-mover, and it explodes;
- the stack is empty, or its top moves left too, and the left-mover survives for good.

Each asteroid is pushed at most once and popped at most once, so the nested loop is still O(n) overall.
