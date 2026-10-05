---
title: Alternatives compared
---

| Approach | Time | Space | How it works |
| --- | --- | --- | --- |
| **Queue, mark when found** (`bfs_graph.py`) | **O(V + E)** | **O(V)** | Take the front node and add its unfound neighbors at the back. |
| Distances in place of visited (`bfs_shortest_paths.py`) | O(V + E) | O(V) | The same loop with a dictionary: a node gets its distance when found, one more than the node that found it, and being in the dictionary means visited. |
| Depth-first search | O(V + E) | O(V) | The same loop with a stack: it reaches the same nodes, deepest first, with no distance order. |
| Dijkstra's algorithm | O((V + E) log V) | O(V) | For weighted edges: a priority queue takes the node with the smallest total weight so far, where breadth-first search counts edges. |

Breadth-first search finds the fewest edges, which is the shortest path only when every edge costs the same. With weights, a path of more edges can be cheaper, and Dijkstra's algorithm takes over.

Pick breadth-first search when the answer is about distance or levels: the fewest moves, the nearest target, or a tree one level at a time. Pick depth-first search when the answer depends on whole paths or subtrees.
