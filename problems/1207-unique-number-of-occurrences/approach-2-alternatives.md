---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Sort and count runs | O(n log n) | O(n) | Sorted, equal numbers sit together; each run's length is a count, collected and checked for repeats. |
| **Two hashmaps** (chosen) | **O(n)** | **O(n)** | Count each number, then claim each count in a second map; a count already claimed returns `False`. |
| Set of counts | O(n) | O(n) | `len(set(counter.values())) == len(counter)`: the counts are unique exactly when no count collapses in the set. |
| Count arrays | O(n + R) | O(R) | The numbers lie in −1000…1000, so a list of R = 2001 slots can hold the counts in place of a hashmap. |

The two hashmaps stop at the first shared count. The set of counts is shorter but always builds the whole set before it compares.
