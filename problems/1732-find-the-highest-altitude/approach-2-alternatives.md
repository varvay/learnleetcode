---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| List of altitudes | O(n) | O(n) | Build every altitude into a list, then take its max. |
| **Running sum** (chosen) | **O(n)** | **O(1)** | Carry the current altitude and the highest so far through one loop. |
| `max(accumulate(gain, initial=0))` | O(n) | O(1) | The same running sum in one line. `accumulate` yields each sum as `max` asks for it, so no list is built. |

No approach beats O(n): any gain left unread could be the one that sets the peak.
