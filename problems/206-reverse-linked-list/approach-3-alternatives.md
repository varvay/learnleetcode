---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Copy the values onto a stack | O(n) | O(n) | Push every value, then walk the list again and pop them back in. |
| Recursion, reverse the rest first | O(n) | O(n) | Reverse `head.next` recursively, then hook `head` onto the end: `head.next.next = head`, `head.next = None`. |
| Recursion, pass the predecessor down (`solution-1-original.py`) | O(n) | O(n) | Each call points its node to the predecessor it was given, `to_be_tail`, and hands the last node back up as the new head. |
| **Three pointers** (chosen, `solution-2-iterative.py`) | **O(n)** | **O(1)** | Move one node per turn from the original part to the front of the reversed part. |

Both recursions keep one call per node on the stack. Python's default recursion limit is 1,000 calls, and a 5,000-node list, the largest the problem allows, raised `RecursionError` under that limit when run locally.

`solution-1-original.py` is the three-pointer loop written as recursion: `to_be_tail` plays `prev`, with one call per node where the loop reuses one variable. The second value `reverse` returns is always the caller's own `to_be_head`, so `reversed_tail.next = to_be_head` points a node to itself, and the line after it overwrites that.
