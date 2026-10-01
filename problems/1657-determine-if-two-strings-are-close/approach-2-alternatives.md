---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| **Count of counts** (chosen) | **O(n + m)** | **O(1)** | Count each letter, then count how many letters have each count, and compare the maps key by key. |
| Sorted counts | O(n + m) | O(1) | Count each letter, then sort the at most 26 counts and compare the sorted lists. |
| `Counter` | O(n + m) | O(1) | `Counter(word)` for the letters, `Counter(counts.values())` for the counts, then two `==` comparisons. |
| `str.count` per letter | O(26 · (n + m)) | O(1) | `word.count(ch)` for each of the 26 letters gives every count at once. |

All four have the same bounds, since there are only 26 letters. They differ in how much of the counting runs in C instead of the Python interpreter: `str.count` scans in C, so 26 scans of each word beat one Python loop. On two 100,000-letter words, it ran about six times faster than the chosen code in a local timing.
