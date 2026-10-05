---
title: Let the two parts order the four lines
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `prev` | the head of the reversed part, or `None` before any node is moved |
| `node` | the head of the part still in original order, or `None` once every node is moved |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `prev, node = None, head` | nothing is reversed yet | the reversed part is empty, and the whole list is still in order |
| `while node:` | a node is left to move | the loop runs once per node |
| `next_node = node.next` | `node`'s arrow is about to be overwritten | the rest of the list stays reachable |
| `node.next = prev` | `node` joins the reversed part | it points to the old head of that part |
| `prev = node` | the reversed part has a new head | `prev` is that head |
| `node = next_node` | the original part lost its first node | `node` is its new head |
| `return prev` | `node` is `None` | `prev` heads the whole reversed list |

The order is fixed by what each line reads. `next_node = node.next` must come before `node.next = prev`, which overwrites it. `node.next = prev` must come before `prev = node`, so it still links to the old head. `prev = node` must come before `node = next_node`, so it still holds the node just moved.

The method carries over: write down what each pointer means, then order the updates so that no line reads a value an earlier line already overwrote.
