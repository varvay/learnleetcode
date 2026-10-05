---
title: Let the variables' meanings write the loop
---

**What each variable always means, after each pass of the loop:**

| Variable | Always means |
| --- | --- |
| `left`, `right` | the window is `nums[left..right]`, and it holds at most one zero |
| `zeros` | how many zeros lie in `nums[left..right]` |
| `best` | the longest valid window so far, minus the one deleted element |

**Each statement is the smallest change that keeps those meanings true:**

| Code | What happened | What it restores |
| --- | --- | --- |
| `if num == 0: zeros += 1` | `right` moved one cell, bringing in `num` | `zeros` counts the new cell |
| `while zeros > 1:` | the new cell may be a second zero | the window must hold at most one zero again |
| `if nums[left] == 0: zeros -= 1`, then `left += 1` | the leftmost cell leaves | `zeros` stops counting a cell no longer in the window |
| `best = max(best, right - left)` | the window is valid again | its length is `right - left + 1`; minus the deletion, `right - left` |

The `while` stops as soon as one zero has left, so the window it leaves behind is the longest valid one ending at `right`.

The method carries to other sliding windows: state what the window and its counters mean, then each move of either edge is followed by the one update that keeps those meanings true.
