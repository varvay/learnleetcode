---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| Parent pointers and an ancestor set | O(n) | O(n) | Walk the tree once to record each node's parent, collect `p`'s ancestors in a set, then climb from `q` until reaching one of them. |
| Compare root-to-node paths | O(n) | O(n) | Find the path from the root to `p` and to `q`; the LCA is the last node the two paths share. |
| **Count found in each subtree** (chosen, `solution-1-original.py`) | **O(n)** | **O(h)** | Each call returns how many of `p` and `q` its subtree holds; the first count of 2 marks the LCA. |
| Return the node itself (`solution-2-short.py`) | O(n) | O(h) | Each call returns `None`, `p` or `q`, or the LCA; a node whose two subtrees both return something is the LCA. |

The first two follow the definition directly, tracing paths, but need memory for the whole tree or path. The recursive two find the meeting point from above with only the recursion stack. A tree can have 100,000 nodes, and on a chain that long `solution-1-original.py` raised `RecursionError` under Python's default limit of 1,000 calls when run locally.
