---
title: Read the problem as a window
---

Deleting one element from a subarray leaves all 1's exactly when the subarray holds at most one zero. So the question becomes: **what is the longest subarray with at most one zero?** The answer is its length minus 1.

The deletion is required. A subarray of only 1's still loses one element, so [1, 1, 1] gives 2. Every window pays that 1, which is why the code records `right - left` and not the window's length, `right - left + 1`.

This is [Max Consecutive Ones III](../1004-max-consecutive-ones-iii/) with k = 1: the same window, recorded one shorter.
