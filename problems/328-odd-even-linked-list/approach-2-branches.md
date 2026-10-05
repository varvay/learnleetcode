---
title: Let the tails' meanings fix the order
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `odd` | the tail of the odd chain |
| `even` | the tail of the even chain, or `None` once the nodes run out |
| `even_start` | the head of the even chain |
| `odd.next` | `even`: the odd tail is still linked to the even tail that follows it |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `if not head: return head` | the list is empty | the empty list is the answer, and `head.next` below is safe |
| `odd, even = head, head.next` | positions 1 and 2 start the two chains | each chain has its first node as its tail |
| `while even and even.next:` | a node follows the even tail | that node is the next odd one |
| `odd.next = even.next`, `odd = odd.next` | the next odd node joins the odd chain | `odd` is its new tail |
| `even.next = odd.next`, `even = even.next` | the node after it, or `None`, joins the even chain | `even` is its new tail, so `odd.next` is `even` again |
| `odd.next = even_start` | the nodes ran out | the even chain goes after the odd chain |

**Why `odd` moves first.** The last row of the first table is the one that decides the order. While `odd.next` is `even`, the next even node isn't reachable through `odd` yet. Linking `even.next = odd.next` at that point links `even` to itself: `attempt-1.py` does this, so the loop never ends. Saving `tmp = odd.next` before `odd` moves saves the even tail instead of the next even node, so the even chain falls one node behind and loses the last node on even lengths, as in `attempt-3.py`. Moving `odd` first makes `odd.next` the next even node, which is exactly what `even` needs.

**Where the loop stops.** On an odd length, `even` becomes `None` and `odd` is the last node. On an even length, `even` is the last node and `even.next` is `None`. Either way the even chain already ends in `None`, so `odd.next = even_start` is the only link left.

The method carries over: write down what each pointer means, including how the pointers relate to each other, and order the updates so that relation is true whenever the next update reads it.
