---
title: Let the variables' meanings write the loop
---

| Variable | Always means |
| --- | --- |
| `s` | the altitude of the point the loop has reached |
| `m` | the highest altitude among the points reached so far, including point 0 |

| Code | What happened | What it restores |
| --- | --- | --- |
| `s = m = 0` | only point 0 is reached | its altitude is 0, and it is the highest so far |
| `s = s+g` | the biker moves one point on | `s` is the new point's altitude |
| `m = max(m, s)` | a new point joined the reached ones | `m` covers it too |

There is no branch to choose: every gain moves the biker one point, so every pass does the same two updates.

The method carries over: state what each running variable means, and each loop step is the update that keeps that meaning true for one more element.
