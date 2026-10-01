---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Brute force | O(n²) | O(1) | From each start, extend the end until the window holds a second zero. |
| Runs of 1's | O(n) | O(1) | Track the run of 1's ending here and the run just before the last zero. Deleting that zero joins them, so the answer is the largest sum of the two. An array with no zero needs 1 subtracted. |
| **Sliding window** (chosen) | **O(n)** | **O(1)** | right adds a cell; left drops cells until the window holds at most one zero. |
| Non-shrinking window | O(n) | O(1) | left moves at most one step per step of right, so the window never shrinks and its final size minus 1 is the answer. |

The sliding window keeps one rule — the window holds at most one zero after every step — and the mandatory deletion is the same `- 1` for every window. Runs of 1's is as fast, but the all-1's array needs its own case.
