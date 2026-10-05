---
title: From every start to one sliding window
---

**1. Restate what a valid answer looks like.** Deleting one element from a subarray leaves all 1's exactly when the subarray holds at most one zero. So the question becomes: what is the longest subarray with at most one zero? The answer is its length minus 1, because the deletion is required: [1, 1, 1] gives 2.

**2. Try it by hand, from every start.** On [0, 1, 1, 1, 0, 1, 1, 0, 1], start at index 0 and extend right until a second zero appears: [0, 1, 1, 1] is the longest from there. Then start at index 1 and extend again, and notice the work repeats: indices 1 to 3 were just read, and they still fit.

**3. Ask what the repeated scan already knew.** Fix a start and grow the end: the zero count only goes up. Once it passes 1, every longer window from that start fails too. So when the window breaks, the start must move forward, and it never has to move back. Nothing the scan learned needs to be thrown away.

**4. What to carry: the window and its zero count.** Keep the start `left`, the end `right`, and how many zeros lie between. Each step of `right` adds one cell; while the window holds two zeros, `left` drops cells until it holds one. Each index enters once and leaves at most once, so the whole pass is O(n).

This is [Max Consecutive Ones III](../1004-max-consecutive-ones-iii/) with k = 1, recorded one shorter.

The reusable recipe: for the longest subarray whose count of something must stay under a limit, and the count only grows as the window grows, slide a window: the right edge adds, the left edge drops until the window is valid again, then record.
