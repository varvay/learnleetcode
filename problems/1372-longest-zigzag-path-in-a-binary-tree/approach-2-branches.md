---
title: Let the two lengths' meanings write the pushes
---

| Variable | Always means, for `current` |
| --- | --- |
| `left` | the longest zigzag ending at `current` whose next move would be left: it arrived by a right move |
| `right` | the longest zigzag ending at `current` whose next move would be right: it arrived by a left move |
| `best` | the longest zigzag seen at any popped node |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `stack, best = [(root, 0, 0)], 0` | nothing arrives at the root | both lengths start at 0 |
| `best = max(best, left, right)` | both zigzags ending here are complete candidates | `best` covers every popped node |
| `stack.append((current.right, right+1, 0))` | a right move extends the zigzag that wanted a right turn | at the child, that zigzag now wants a left turn; nothing arrives there by a left move |
| `stack.append((current.left, 0, left+1))` | a left move extends the zigzag that wanted a left turn | the mirror image |

The swap is the part that is easy to misread: going right puts `right + 1` into the child's `left` slot. Read the names as "the next move", not "where it came from", and the swap is exactly the alternation.

The method carries over: name each state by what it allows next, and a transition is then the state it continues, one step longer.
