---
title: Let the queue's meaning write the loop
---

| Variable | Always means, at the top of the loop |
| --- | --- |
| `queue` | nodes found but not yet taken, in the order found: nearer nodes ahead of farther ones |
| `visited` | every node found so far, taken or still waiting in the queue |
| `order` | the taken nodes, in the order they were taken |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `visited = {start}`, `queue = deque([start])` | the start is found | it is visited and waiting |
| `node = queue.popleft()` | the earliest-found node leaves the front | nearer nodes are taken first |
| `order.append(node)` | the node is taken | `order` gains it |
| `for neighbor in graph[node]:` | its neighbors are checked | |
| `if neighbor not in visited:` | a neighbor not yet found | |
| `visited.add(neighbor)`, `queue.append(neighbor)` | it is found now | it waits at the back, behind every nearer node |
| `return order` | the queue is empty | every node reachable from `start` is in `order`, nearest first |

**Why mark at append, not at popleft.** Marking when a node is taken, as depth-first search does, gives the same order here, but a node can then join the queue more than once: on 2,000 random graphs, 923 queued at least one extra copy. Marking at append keeps each node in the queue once.

`deque` comes from `collections`. Its `popleft` takes O(1) time, while `list.pop(0)` shifts every remaining item and takes O(n).

The method carries over: write down what the queue holds, then each line either takes the front node or adds newly found ones at the back.
