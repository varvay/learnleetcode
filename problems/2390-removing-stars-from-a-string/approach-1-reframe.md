---
title: The last letter kept is the first removed
---

**1. Remove the stars by hand, one character at a time.** On "leet**cod*e": read l, e, e, t, then a star. It removes t, the closest letter to its left. The next star removes the second e. Every time a letter is read, there is no way to know yet whether a later star will remove it.

**2. Find what must be carried across that gap.** Every letter kept so far, in order, because any of them may still be removed.

**3. Notice which kept letter a star removes.** Always the most recent one still there: last kept, first removed. That is exactly what a stack does: push each letter, and a star pops the top. A star never meets an empty stack, because the problem guarantees every operation is possible.

**4. Read off the answer.** Whatever is left on the stack, bottom to top, is the string after all stars. The order in which stars are applied doesn't change the result, so applying them as they arrive gives it in one pass.

The reusable recipe: when a later element cancels the most recent surviving earlier one, keep the survivors on a stack.
