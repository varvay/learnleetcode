---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Expand the innermost group, repeat | O(n · output) | O(output) | Find a `k[letters]` with no bracket inside, replace it with its expansion, and rescan until no bracket is left. |
| **Stack of `(count, text)` pairs** (chosen) | **O(output)** | **O(n)** | Push the count and the outside text at `[`, pop and attach the repeated group at `]`. |
| Recursion | O(output) | O(n) | A function decodes until the next `]` and calls itself at each `[`; the call stack holds what the explicit stack holds. |
| Two stacks | O(output) | O(n) | One stack for texts, one for counts, always pushed and popped together. |

Writing the output takes time proportional to its length, so no approach can do better than O(output). The stack and the recursion both reach that, up to one copy of each group's text per nesting level, and nesting is shallow since `s` is at most 30 characters. The stack keeps everything in one loop; the recursion reads closer to the grammar `k[...]`.
