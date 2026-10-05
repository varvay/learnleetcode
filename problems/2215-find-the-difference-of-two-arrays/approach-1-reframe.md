---
title: Only membership matters
---

**1. Solve it by hand.** For nums1 = [1, 2, 3, 3] and nums2 = [1, 1, 2, 2], take each value of nums1 and look for it in nums2: 1 is there, 2 is there, 3 is not, 3 is not. Two things go wrong at once: every lookup scans all of nums2, and 3 comes out twice.

**2. Ask what the answer depends on.** Only on which values each array contains. Order, position, and how often a value repeats change nothing. So each array can be reduced to its distinct values before comparing.

**3. Pick the structure that answers "is x in there?" fast.** A hashmap keyed by value does both jobs: writing a repeated value again leaves one key, which removes the duplicates, and a lookup takes constant time on average, where scanning the other array costs its whole length.

**4. Compare key by key, in both directions.** Loop over the keys of one map and keep those the other map lacks; then the same the other way round. Looping over keys rather than over the original array is what keeps each output list distinct.

The reusable recipe: when the answer depends only on whether values appear, reduce each collection to the keys of a hashmap and answer each question with a lookup.
