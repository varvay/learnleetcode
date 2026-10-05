---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Copy the nodes into a list | O(n) | O(n) | Store every node in an array, then set `nodes[n // 2 - 1].next = nodes[n // 2].next`. |
| Count, then walk again | O(n), two passes | O(1) | The first pass finds n; the second stops at index n // 2 − 1. |
| One cursor, move the middle every other node (`solution-1-original.py`) | O(n) | O(1) | `cursor` visits every node, and a parity counter moves `mid_cursor` on every second one, with `prev_cursor` one behind it. |
| **Fast and slow pointers** (chosen, `solution-2-clean.py`) | **O(n)** | **O(1)** | `fast` moves two nodes per turn and `slow` one, starting two apart, so `slow` stops on the node before the middle. |

The last two make the same single pass. On a 100,000-node list in CPython, measured on one machine, the original took 12.0 ms and fast and slow took 2.3 ms. The original runs n turns with a modulo and a counter in each, while fast and slow runs n/2 turns of two pointer moves.
