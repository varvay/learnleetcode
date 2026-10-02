---
title: Let the variables' meanings write the branches
---

The `if`/`elif` chain follows from two lists: the kinds of character the input can hold, and what each variable means at every moment.

**The kinds of character.** The constraints allow four: digits, `[`, `]`, and lowercase letters. Each means something different, so each gets one branch, with the letter as the `else` for whatever is left.

**What each variable always means:**

| Variable | Always means |
| --- | --- |
| `k` | the count being read, from the digits since the last bracket |
| `current` | the decoded text since the last unclosed `[`, or since the start |
| `stack` | one saved pair `(repeat, before)` per `[` that hasn't closed yet |

**Each branch is the smallest change that keeps those meanings true:**

| Character | What it means | What must change | Code |
| --- | --- | --- | --- |
| digit | one more digit of the count | append it to `k` | `k = k * 10 + int(token)` |
| `[` | a new group starts | it is unclosed, so save its pair; `k` and `current` must now describe the new group | `stack.append((k, current))`, then `k, current = 0, ""` |
| `]` | the group ends | it is no longer unclosed, so pop its pair; `current` must describe the outer group again | `repeat, before = stack.pop()`, then `current = before + current * repeat` |
| letter | one more character of output | `current` gains it | `current += token` |

A branch that broke a meaning would hand the next branch wrong data: skip the reset of `k` at `[`, and `2[3[a]]` reads its inner count as 23. The four kinds never overlap, so the order of the checks doesn't matter.

The method carries to other problems: list the kinds of input, write down what each variable always means, then write the update that keeps every meaning true for each kind.
