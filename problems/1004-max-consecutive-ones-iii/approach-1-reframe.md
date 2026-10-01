---
title: Read the problem as a window
---

"Consecutive 1's" means a contiguous run, so the answer is the length of some subarray. Flipping at most k zeros turns a subarray into all 1's exactly when it holds at most k zeros. So the question becomes: **what is the longest subarray with at most k zeros?** The code never flips anything; it counts zeros.

Two features point to a sliding window. The answer is a contiguous range, and the condition is a count kept under a limit. Growing a range can only raise its zero count, so a range over the limit stays over it as it grows. The window relies on that.
