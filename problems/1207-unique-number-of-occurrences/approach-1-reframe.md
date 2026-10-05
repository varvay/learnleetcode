---
title: Count, then look for a repeated count
---

**1. Solve it by hand.** On [1, 2, 2, 1, 1, 3], count each number: 1 appears 3 times, 2 twice, 3 once. Then check the counts 3, 2, 1: no two are equal, so the answer is true.

**2. Notice the two layers.** The first layer asks how often each number appears. The second asks whether any two numbers share a count. Both are the same question underneath: have I seen this before? The first asks it of numbers, the second of counts.

**3. Pick a hashmap for each layer.** A map from number to count answers the first layer in one pass. A second map, keyed by count, answers the second: each count is claimed by the first number that has it, and a count already claimed means two numbers share it.

**4. Stop at the first clash.** One shared count settles the answer, so the scan returns `False` there without checking the rest.

The reusable recipe: when a question is about a property of the counts, count first, then treat the counts as the new data and ask the question of them.
