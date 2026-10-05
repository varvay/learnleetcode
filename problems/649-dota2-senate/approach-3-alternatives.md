---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Search for each ban's target | O(n²) | O(n) | Mark senators as banned; on each vote, scan ahead, wrapping round the end, for the next rival still in. |
| Two queues of turn positions | O(n) | O(n) | One queue per party holds each senator's position. The earlier of the two fronts bans the later one and rejoins its queue at position + n. |
| **One queue, ban counts** (chosen, `solution-2-clean.py`) | **O(n)** | **O(n)** | Pop the front: a waiting ban removes the senator, otherwise they ban the next rival and go to the back. Stop when a party has no senators left. |
| One queue, ban counts, stop past n (`solution-1-original.py`) | O(n) | O(n) | The same turns, stopping once a ban count exceeds `len(senate)`. |

A ban count exceeds n only after its party is gone, while the survivors keep voting and banning an empty party, so `solution-1-original.py` returns the same winner after at most n + 1 extra turns. The two-queue version removes one senator per comparison, so it ends within n comparisons. The chosen version needs no comparison, because each ban waits for the next rival to come up.
