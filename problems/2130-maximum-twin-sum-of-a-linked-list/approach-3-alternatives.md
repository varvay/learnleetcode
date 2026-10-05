---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Copy into a deque, pop both ends (`solution-1-original.py`) | O(n) | O(n) | Copy every value, then pop one from each end per pair. |
| Copy into a list, index the twins | O(n) | O(n) | Copy every value, then take `values[i] + values[n - 1 - i]` for each i in the first half. |
| Stack of the second half (`solution-2-stack.py`) | O(n) | O(n) | Find the middle, push the second half's values, then pop one per node while walking from the head. |
| **Reverse the second half** (chosen, `solution-3-reverse-half.py`) | **O(n)** | **O(1)** | Find the middle, reverse the second half in place, then walk both halves together. |

The stack and the reversal do the same job: both make the second half read from its end. The stack holds that order in n/2 values, and the reversal holds it in the list's own `next` pointers. So the copies leave the input list untouched, and the chosen approach rewires it. On a 100,000-node list in CPython, measured on one machine, `solution-1-original.py` took about 10 ms, `solution-2-stack.py` about 9 ms, and the chosen approach about 8 ms: the gain is memory more than speed.
