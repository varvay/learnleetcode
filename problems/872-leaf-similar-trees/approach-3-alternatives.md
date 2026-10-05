---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Collect both leaf lists | O(n₁ + n₂) | O(n₁ + n₂) | Walk each tree fully, append its leaves to a list, and compare the lists. |
| **Two stacks in lockstep** (chosen, `solution.py`) | **O(n₁ + n₂)** | **O(h₁ + h₂)** | Walk both trees with their own stacks, one leaf at a time, and stop at the first mismatch. |
| Two leaf generators | O(n₁ + n₂) | O(h₁ + h₂) | Write the walk once as a generator that yields each leaf, then compare the two generators pair by pair with `itertools.zip_longest`. |

The lists are the simplest to write, but they hold every leaf and always walk both trees to the end. The stacks and the generators keep only each walk's place; a generator writes the walk once, where the stacks write it twice.
