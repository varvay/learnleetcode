---
title: Let the variables' meanings write the branches
---

| Variable | Always means |
| --- | --- |
| `stack` | the asteroids read so far that are still alive, left to right |
| `asteroid` | the asteroid being placed; `0` once it has exploded |

| Code | What happened | What it restores |
| --- | --- | --- |
| `while asteroid < 0 and stack and stack[-1] > 0:` | a collision is possible: the new one moves left, the top moves right | the loop runs exactly as long as one is |
| `if abs(asteroid) == stack[-1]:` then `asteroid = 0`, `stack.pop()` | equal sizes | both are gone |
| `elif abs(asteroid) > stack[-1]:` then `stack.pop()` | the new one is bigger | the top is gone; the new one meets the next top |
| `else: asteroid = 0` | the top is bigger | the new one is gone; the top stays |
| `if asteroid != 0: stack.append(asteroid)` | the run ended | a survivor joins the stack |

Using `0` for "exploded" is safe because the constraints rule out an asteroid of size 0.

The method carries over: when one input can change several stack entries, the `while` condition is the situation in which a change is possible, and each branch inside is one outcome of it.
