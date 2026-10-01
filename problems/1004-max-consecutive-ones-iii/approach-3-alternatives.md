---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Brute force | O(n²) | O(1) | From each start, extend the end until the window holds k + 1 zeros. |
| Prefix sums + binary search | O(n log n) | O(n) | Store the zero count up to each index. The counts never decrease, so for each start a binary search finds the furthest end with at most k zeros. |
| Binary search on the length | O(n log n) | O(1) | If a window of length L fits, one of length L − 1 fits too. Binary-search L, checking each with a fixed-size window. |
| **Sliding window** (chosen) | **O(n)** | **O(1)** | right adds a cell; left drops cells until the window holds at most k zeros. |
| Non-shrinking window | O(n) | O(1) | left moves at most one step per step of right, so the window never shrinks and its final size is the answer. |
| Queue of zero positions | O(n) | O(k) | Keep the indices of the window's zeros. When over k, left jumps past the oldest zero in one move. |

The sliding window takes one pass and one counter, and its rule — the window holds at most k zeros after every step — is easy to check. The non-shrinking window has the same bounds, but why it is correct is harder to see. The queue replaces left's single steps with one jump, at the cost of O(k) memory; both are O(n).
