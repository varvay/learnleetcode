---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Walk down from every node (`solution-1-original.py`) | O(n · h) | O(h) | Each node starts its own walk with a running sum, counting every node where the sum hits the target. |
| **Prefix sums in a hash map, recursive** (chosen, `solution-2-prefix-sums.py`) | **O(n)** | **O(h)** | One walk from the root; each node looks up `running − targetSum` among its ancestors' sums. |
| Prefix sums, iterative | O(n) | O(h) | The same walk with an explicit stack that also pushes an exit marker for each node, so its sum is removed after its subtree. |

Measured locally on about 1,000 nodes, the problem's limit: on a balanced tree the walk from every node took 1.6 ms and the prefix sums 0.4 ms; on a chain, 79.1 ms against 0.6 ms. The chain is where O(n · h) becomes O(n²).

The recursive version is one call per level, and a 1,000-node chain exceeds Python's default limit of 1,000 calls: it raised `RecursionError` locally until the limit was raised. The iterative version has no such limit.
