---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Copy the values into two lists | O(n) | O(n) | Collect the odd-position and even-position values, then write them back in order. |
| Two dummy heads | O(n) | O(1) | Walk with a position counter and append each node to an odd or even dummy chain, then join the chains and end the even one with `None`. |
| **Odd and even tails** (chosen, `solution-2-clean.py`) | **O(n)** | **O(1)** | Grow both chains together: the node after the even tail joins the odd chain, and the node after the new odd tail joins the even chain. |
| Odd and even tails with extra guards (`solution-1-original.py`) | O(n) | O(1) | The same relinking, checking for an empty list in the loop condition and before the final link, and setting `even.next = None`, which is already `None`. |

The problem statement asks for O(1) extra space, which rules out the copy. The dummy heads need a counter and a branch per node, while the tails approach handles one odd and one even node per turn with no branch.
