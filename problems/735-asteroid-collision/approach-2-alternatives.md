---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Repeated passes | O(n²) | O(n) | Scan for a right-mover followed by a left-mover, resolve that collision, and start again until a scan finds none. |
| **Stack** (chosen) | **O(n)** | **O(n)** | Keep the survivors on a stack; each left-mover pops the smaller right-movers on top until it explodes or survives. |
| Stack inside the input | O(n) | O(1) extra | The same stack, stored in the front of `asteroids` with a write index, so no second list is needed. |

The stack resolves each collision the moment the left-mover arrives, so no asteroid is looked at again after it explodes. The repeated passes rescan the survivors after every collision.
