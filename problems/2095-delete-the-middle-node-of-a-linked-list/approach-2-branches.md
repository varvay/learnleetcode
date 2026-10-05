---
title: Let the pointers' meanings write the loop
---

| Variable | Always means, at the top of the loop, after i turns |
| --- | --- |
| `slow` | the node at index i |
| `fast` | the node at index 2i + 2, or `None` once that index is past the end |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `if not head.next: return None` | the list has one node, which is the middle | the empty list is the answer, and `head.next.next` below is safe |
| `slow, fast = head, head.next.next` | no turns yet, i = 0 | `slow` at index 0, `fast` at index 2 |
| `while fast and fast.next:` | both index 2i + 2 and 2i + 3 exist | there is room for `fast` to move two nodes |
| `slow = slow.next`, `fast = fast.next.next` | one more turn, i grows by 1 | `slow` gains 1 and `fast` gains 2 |
| `slow.next = slow.next.next` | the loop stopped | `slow` is right before the middle, so this unlinks it |

Where the loop stops depends on whether n is even or odd:

| n | `fast` stops at | `slow` stops at |
| --- | --- | --- |
| even | index n, which is `None` | index n/2 − 1 |
| odd | index n − 1, the last node | index (n − 3)/2 |

Both are n // 2 − 1, the node before the middle.

The method carries over: write down where each pointer always is, make each turn the smallest move that keeps it there, then solve the stop condition for the index you need.
