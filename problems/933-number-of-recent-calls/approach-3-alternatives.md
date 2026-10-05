---
title: Alternatives compared
---

| Approach | Time per ping | Space | How it works |
| --- | --- | --- | --- |
| Keep every ping, count each time | O(n) | O(n) | Store all pings and count those in `[t - 3000, t]` on every call. |
| Keep every ping, binary search | O(log n) | O(n) | Pings arrive sorted, so `bisect` finds where the window starts; the answer is the distance to the end. |
| **Queue** (chosen) | **O(1) amortized** | **O(3001)** | Add each ping at the back and drop expired ones from the front. |
| Ring buffer | O(1) amortized | O(3001) | The same queue stored in a fixed list of 3001 slots, with front and back indices that wrap around. |

The queue forgets pings that can never count again, so its memory stays bounded by the window, while the first two keep all n pings. The ring buffer saves the queue's allocations but needs the window size fixed in advance.
