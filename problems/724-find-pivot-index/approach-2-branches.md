---
title: Let the variables' meanings write the loop
---

| Variable | Always means, at index `i` after the updates |
| --- | --- |
| `l` | the sum of the numbers left of `i`: `nums[0]` to `nums[i - 1]` |
| `r` | the sum of the numbers right of `i`: `nums[i + 1]` to the end |

| Code | What happened | What it restores |
| --- | --- | --- |
| `l = 0`, `r = sum(nums)` | the split is before index 0 | nothing is left of it; everything is right of it |
| `r -= nums[i]` | the split reached `i` | `nums[i]` is the pivot itself, so it leaves the right side |
| `if i != 0: l += nums[i-1]` | the number just passed | it joins the left side; at index 0 nothing was passed |
| `if l == r: return i` | both sides are known | a balance is a pivot, and the first one is the leftmost |
| `return -1` | the loop ended | no index balanced |

`s = sum(nums)` is never read, so removing it changes nothing.

The method carries over: write down which elements each running sum covers at index `i`, and each update is the element that just crossed the boundary.
