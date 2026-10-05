---
title: Find what the operations can't change
---

**1. Try the operations by hand.** Swapping turns "abc" into "bca": the letters move, their counts stay. Transforming every a into b and every b into a turns "aacabb" into "bbcbaa": the letter a now has b's old count and b has a's. Searching through sequences of operations would never end, so look for what stays fixed instead.

**2. List what neither operation changes.**
- Swapping changes only order, so order never matters; how often each letter appears does.
- Transforming trades the counts of two letters that are already in the word. The set of letters stays the same, and so does the list of counts; only which letter holds which count changes.

**3. Check that those are also enough.** If two words use the same letters and the same counts, ignoring which letter has which, the transformation can hand each count to the right letter, and swaps then put the letters in order. So close means exactly: same letters, same count pattern. Equal length follows, which makes it a cheap first check.

**4. Turn "same counts, ignoring letters" into something comparable.** Count each letter, then count how many letters have each count. Two words have the same pattern exactly when those second maps are equal.

The reusable recipe: when operations can be applied any number of times, stop simulating them and find the invariants, the things no operation changes; then compare the invariants.
