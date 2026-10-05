---
title: One meaning per loop
---

Each of the three loops keeps its own pair of pointers true:

| Loop | Variables | Always mean, at the top of the loop, after i turns |
| --- | --- | --- |
| find the middle | `slow`, `fast` | the nodes at index i and 2i |
| reverse the second half | `prev`, `slow` | the head of the reversed part, and the head of the part not yet reversed |
| sum the twins | `front`, `back` | twins: the nodes at index i and n − 1 − i |
| sum the twins | `best` | the largest twin sum among the first i pairs |

**Where each loop stops:**

| Loop | Stops when | Which leaves |
| --- | --- | --- |
| `while fast:` | `fast` is `None`, at index n | `slow` at index n/2, the first node of the second half |
| `while slow:` | the second half is used up | `prev` on the last node, the head of the reversed second half |
| `while back:` | `back` has walked the n/2 reversed nodes | `best` over every pair |

`while fast:` needs no `fast.next` check: `fast` only lands on even indices, and n is even, so `fast` is never the last node. The second loop is 206's loop, with `slow` in the role of `node`. In the third, `back` stops after exactly n/2 steps, so `front` never walks past the first half.

The method carries over: give each loop its own meaning, and solve its stop condition for what the next loop needs.
