---
title: Let the variables' meanings write the branches
---

| Variable | Always means |
| --- | --- |
| `counter` | maps each number read so far to how often it has appeared |
| `unique` | maps each count checked so far to the number that claimed it first |

| Code | What happened | What it restores |
| --- | --- | --- |
| `if num not in counter: counter[num] = 1` | a number appears for the first time | it is counted once |
| `else: counter[num] += 1` | a number appears again | its count goes up by one |
| `if counter[num] not in unique: unique[counter[num]] = num` | a count no number has claimed yet | this number claims it |
| `elif unique[counter[num]] != num: return False` | a count already claimed | another number has the same count, so the answer is false |
| `return True` | every count was claimed once | no two numbers share a count |

Each number comes up once as a key of `counter`, so a claimed count was always claimed by a different number: the `elif` test is always true when it runs.

The method carries over: give each map one meaning, and each branch is either a first sighting or a repeat of what that map tracks.
