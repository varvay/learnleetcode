---
title: Let the stacks' meaning settle the three exits
---

| Variable | Always means, at the top of the outer loop |
| --- | --- |
| `stack1`, `stack2` | the subtrees of each tree not yet walked, the leftmost on top |
| the two walks | have produced the same number of leaves so far, and they matched pair by pair |

Every node on a stack is the root of a subtree, and every subtree has at least one leaf. So a stack is empty exactly when its tree has no leaves left. That one fact decides all three exits:

| Code | What happened | Answer |
| --- | --- | --- |
| `if not stack2: return False` | tree 1 reached a leaf, and tree 2 has none left | tree 1 has more leaves |
| `if current1.val != current2.val: return False` | the next leaves of the two trees differ | the sequences differ |
| `return not stack2` | tree 1 has no leaves left | similar only if tree 2 has none left either |

Inside the inner loop, `break` after a match returns to tree 1 with both walks one leaf further, so the second row of the first table holds again. The inner loop can never empty `stack2` without reaching a leaf, by the same fact.

The method carries over: say what an empty stack means, and each exit follows from it.
