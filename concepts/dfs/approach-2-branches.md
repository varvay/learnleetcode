---
title: Let the stack's meaning write the loop
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `stack` | nodes found but not yet taken, the most recently found on top; a node may appear twice |
| `visited` | the nodes already taken |
| `order` | the taken nodes, in the order they were taken |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `stack = [start]` | nothing is taken yet | the start is the only node found |
| `node = stack.pop()` | the most recently found node comes off | the walk goes deeper before it goes wider |
| `if node in visited: continue` | an earlier copy of the node was already taken | each node enters `order` once |
| `visited.add(node)`, `order.append(node)` | the node is taken | `visited` and `order` both gain it |
| `for neighbor in reversed(graph[node]):` | its neighbors are found | pushed in reverse, the first one listed is popped next |
| `if neighbor not in visited: stack.append(neighbor)` | a neighbor not yet taken | it waits on the stack |
| `return order` | the stack is empty | every node reachable from `start` is in `order` |

**Why mark at pop, not at push.** Marking a node when it is pushed keeps duplicates off the stack, but it claims the node for whichever node saw it first, not for the path that reaches it deepest. With edges A–B, A–C, A–D, B–D, the recursive walk goes A, B, D, C. Marking at push goes A, B, C, D, because A already claimed D before B could reach it. Marking at pop keeps the order identical to `dfs_recursive.py`.

The method carries over: write down what the stack holds, then each line either takes a node off it or puts the newly found ones on.
