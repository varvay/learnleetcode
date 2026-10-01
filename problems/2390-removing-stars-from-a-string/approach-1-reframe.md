---
title: The last letter kept is the first removed
---

A star removes the closest letter to its left that is still there. Reading left to right, that is always the most recent letter kept: last in, first out, which is exactly what a stack does.

So each letter is pushed, and each star pops the top. A star never meets an empty stack, because the problem guarantees every operation is possible. Whatever is left on the stack, bottom to top, is the answer in order.

The order in which stars are applied doesn't matter, since the result is unique. Processing them left to right as they arrive gives that result in one pass.
