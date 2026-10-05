---
title: Let the counts' meanings write the branches
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `queue` | the senators still in the vote, in the order of their next turns |
| `remaining[p]` | how many senators of party `p` are in `queue` |
| `bans[p]` | bans cast on party `p` and not yet applied: the next `bans[p]` senators of `p` to come up are out |

A senator is stored as their party's letter, `"R"` or `"D"`, since two senators of one party are interchangeable. The vote is decided once a party has no senators left, so the loop runs `while remaining["R"] and remaining["D"]`.

Every turn starts the same way: `senator = queue.popleft()` takes the front, and `rival` names the other party. Then each case is the smallest change that keeps the meanings true:

| Case | What it means | What must change | Code |
| --- | --- | --- | --- |
| `bans[senator]` > 0 | this senator is the one a waiting ban was meant for | the ban is used up, and the senator stays out of `queue` | `bans[senator] -= 1`, `remaining[senator] -= 1` |
| no ban waiting | this senator votes | the next rival to come up loses their turn, and this senator votes again next round | `bans[rival] += 1`, `queue.append(senator)` |

When the loop stops, the party with senators left is the answer.

`deque` comes from `collections`. LeetCode imports it for you; running this file elsewhere needs `from collections import deque` at the top.

The method carries over: write down what each variable always means, then make each case the smallest update that keeps every meaning true.
