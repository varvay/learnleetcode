---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Recursion (`dfs_recursive.py`) | O(V + E) | O(V) | The call stack holds the path back: each call visits its node, then calls itself on each neighbor not yet visited. |
| **Explicit stack** (`dfs_graph.py`) | **O(V + E)** | **O(V + E)** | A list used as a stack holds the nodes still to try; nodes are marked when popped. |
| Breadth-first search | O(V + E) | O(V) | The same loop with a queue: it reaches the same nodes, nearest first. |

Recursion is the shortest to write, but each step deeper is one more call, and Python stops at 1,000 calls by default: a path of 10,000 nodes raises `RecursionError`. The explicit stack has no such limit.

Pick depth-first search when the answer depends on whole paths or whole subtrees: tree depths and sums, cycle detection, connected components, and backtracking through choices. Pick breadth-first search when the answer is about distance, such as the fewest steps from the start.
