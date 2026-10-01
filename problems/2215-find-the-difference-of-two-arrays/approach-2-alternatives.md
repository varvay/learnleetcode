---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Nested scan | O(n · m) | O(n + m) | For each value, scan the other array for it; keep a list of values already output to skip repeats. |
| Sort and merge | O(n log n + m log m) | O(n + m) | Sort both arrays, then walk them together the way merge sort does, skipping repeats. |
| **Two hashmaps** (chosen) | **O(n + m)** | **O(n + m)** | Each array's values become keys; a key is kept when the other map lacks it. |
| Set difference | O(n + m) | O(n + m) | `set(nums1) - set(nums2)` and the reverse: the same lookups, done by the set type. |
| Presence array | O(n + m + R) | O(R) | The values lie in −1000…1000, so a list of R = 2001 flags records which appear. |

The hashmaps make each check a constant-time lookup while every step stays written out. The presence array needs no hashing, but works only because the problem bounds the values.
