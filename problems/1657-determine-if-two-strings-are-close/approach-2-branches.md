---
title: Let the variables' meanings write the loops
---

| Variable | Always means |
| --- | --- |
| `d1`, `d2` | each letter of `word1`, `word2` mapped to how often it appears |
| `c1`, `c2` | each count mapped to how many letters of that word have it |

| Code | What it checks or builds |
| --- | --- |
| `if len(word1) != len(word2): return False` | the cheapest invariant first: equal counts need equal length |
| the two `for token in word` loops | `d1` and `d2`, one count per letter |
| the two `for token in d` loops | `c1` and `c2`, the count pattern of each word |
| `for token in d1: if token not in d2` and the reverse | the same set of letters, checked in both directions |
| `for count in c1:` and `for count in c2:` | the same count pattern: every count has the same number of letters on both sides |
| `return True` | every invariant matched |

Every check returns `False` at its first mismatch, so a word that fails early skips the rest.

The method carries over: name the invariants first, give each one a variable, and the code becomes one loop to build each and one to compare each.
