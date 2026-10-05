---
title: Let the queue's meaning write the method
---

| Variable | Always means, when `ping` returns |
| --- | --- |
| `self.queue` | the pings in `[t - 3000, t]`, oldest at the front |

| Code | What happened | What it restores |
| --- | --- | --- |
| `self.queue = deque([])` | no pings yet | the window is empty |
| `self.queue.append(t)` | a new ping at `t` | it is the newest, so it goes at the back |
| `while self.queue[0] < t - 3000:` | the window moved to `[t - 3000, t]` | the front may now be too old |
| `self.queue.popleft()` | the front expired | drop it; the next one may have expired too |
| `return len(self.queue)` | the front is inside the window | everything behind it is newer, so the whole queue counts |

The `while` never runs on an empty queue: `t` was just appended, and `t` is never older than `t - 3000`, so the loop stops at `t` at the latest.

`deque` comes from `collections`. LeetCode imports it for you; running this file elsewhere needs `from collections import deque` at the top.

The method carries over: state what the queue holds, then a new event goes in the back, and the front is trimmed until the meaning holds again.
