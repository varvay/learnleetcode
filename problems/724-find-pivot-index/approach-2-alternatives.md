---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Brute force | O(n²) | O(1) | At each index, sum the numbers on each side from scratch. |
| Prefix-sum array | O(n) | O(n) | Store the sum up to each index; any index's two sides are then two lookups. |
| **Two running sums** (chosen) | **O(n)** | **O(1)** | r starts at the total and l at 0. At each index, nums[i] leaves r and nums[i − 1] joins l. |
| One running sum | O(n) | O(1) | Keep only the left sum: the right sum is total − left − nums[i], so the test is 2 · left + nums[i] = total. |

The two running sums keep both sides of the test in plain view. Keeping one sum saves a variable, at the cost of a test that needs the identity above to read.
