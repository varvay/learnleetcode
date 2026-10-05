---
title: Let the variables' meanings write the branches
---

| Variable | Always means |
| --- | --- |
| `stack` | the letters read so far that no star has removed, left to right |

| Character | What it means | What must change | Code |
| --- | --- | --- | --- |
| `*` | remove the closest kept letter to its left | that letter is the top of the stack | `stack.pop()` |
| letter | one more letter kept, for now | it goes on top | `stack.append(token)` |

When the loop ends, `stack` is the answer by its own meaning, so `"".join(stack)` returns it.

The method carries over: once the stack means "the survivors so far", each kind of input either adds a survivor or removes the newest one.
