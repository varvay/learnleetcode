---
title: Let the variables' meanings write the loops
---

| Variable | Always means |
| --- | --- |
| `in1`, `in2` | their keys are the distinct values of `nums1`, `nums2` read so far |
| `only1` | the keys of `in1` checked so far that are not in `in2` |
| `only2` | the keys of `in2` checked so far that are not in `in1` |

| Code | What happened | What it restores |
| --- | --- | --- |
| `in1[x] = True` | one more value of `nums1` was read | it is a key; a repeat overwrites the same key, so nothing changes |
| `for x in in1:` | the comparison starts | each distinct value comes up exactly once |
| `if x not in in2: only1.append(x)` | one more key was checked | `only1` holds it exactly when `nums2` lacks it |
| the same two lines with `in2` and `in1` swapped | the other direction | `only2` |

The `True` values are never read: only the keys matter, so the map acts as a set written out by hand.

The method carries over: say what each map's keys stand for, then every loop either adds the next key or checks one, and nothing else.
