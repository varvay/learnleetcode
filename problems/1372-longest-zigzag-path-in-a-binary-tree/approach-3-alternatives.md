---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Walk from every node, both ways | O(n · h) | O(h) | Start a zigzag at each node in each direction and walk until it breaks. |
| Recursion passing the two lengths | O(n) | O(h) | `visit(node, left, right)` updates the best, then calls itself on each child with the lengths the stack version pushes. |
| **Stack of (node, left, right)** (chosen, `solution.py`) | **O(n)** | **O(h)** | The same lengths carried on an explicit stack. |

The recursion and the stack carry the same two numbers; the stack has no recursion limit. A tree can have 50,000 nodes, and on a perfect zigzag chain that long `solution.py` returned 49,999 when run locally.
