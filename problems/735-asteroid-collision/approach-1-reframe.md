---
title: Only right then left collides
---

**1. Find which asteroids can meet.** Two asteroids meet only when the one on the left moves right and the one on the right moves left. Every other combination moves apart or in the same direction, so it never collides.

**2. Read left to right by hand and find where you get stuck.** On [10, 2, -5]: 10 moves right, and nothing can hit it yet, but a later left-mover might. The same for 2. So every right-mover has to be kept, unresolved, until a left-mover arrives.

**3. Notice which kept asteroid a left-mover hits first.** The nearest one: the right-mover kept last. If it wins, it goes on to the one kept before that. Last kept, first hit: the survivors form a stack, and a left-mover works down from its top. On [10, 2, -5], -5 destroys 2, then meets 10 and explodes.

**4. List how a left-mover's run ends.** It meets an equal right-mover and both explode; it meets a bigger right-mover and it explodes; or the stack is empty, or its top moves left too, and it survives for good.

**5. Check the cost.** The loop inside the loop looks quadratic, but each asteroid is pushed at most once and popped at most once, so the whole pass is O(n).

The reusable recipe: when a new element can remove several of the most recent survivors, keep the survivors on a stack and pop in a `while` loop until it stops.
