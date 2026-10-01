---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Edit the string | O(n²) | O(n) | Find a star, cut it and the letter before it, repeat; each cut copies the rest of the string. |
| **Stack** (chosen) | **O(n)** | **O(n)** | Push each letter; a star pops the top. The stack ends as the answer. |
| Write index | O(n) | O(n) | Copy `s` to a list and keep a write position: a letter is written there and the position moves right, a star moves it back one. The answer is the list up to the position. |
| Scan from the right | O(n) | O(n) | Walk backwards counting pending stars; a letter is kept only when none are pending, otherwise it uses one up. Reverse what was kept. |

All but the first are one pass. The stack states the rule most directly; the write index is the same idea with the stack stored inside the copied list.
