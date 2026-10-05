---
title: Go deep, remember the way back
---

**1. State the job.** Visit every node reachable from a start node, each exactly once. The graph is an adjacency list: `graph[node]` lists the node's neighbors.

**2. Walk it by hand and find where you get stuck.** Take the graph with edges A–B, A–C, B–D, B–E, C–F, E–F, and from A always step to the first neighbor not yet seen: A, B, D. D's only neighbor is B, already seen, so the walk hits a dead end. It has to continue from the most recent node that still has an untried neighbor: B, which still has E.

**3. Find what to remember.** The neighbors still to try, newest first, since a dead end sends the walk back to the most recent branch. Last in, first out is a stack: push a node's neighbors when it is visited, and pop to choose the next node.

**4. Stop the cycles.** A, B, E, F, C leads back to A. Without memory the walk would go round forever, so keep a visited set and skip any node already in it.

**5. Make the stack walk like the hand walk.** Push the neighbors in reverse, so the first one listed comes off first. And a node can sit on the stack twice: A pushes C, and later F pushes C again. So check `visited` when a node is popped, and skip it if an earlier copy was already taken.

**6. Check the cost.** Each node is visited once and each adjacency list is read once: O(V + E) time. The visited set takes O(V) space, and the stack can hold up to one entry per edge end, O(E).

The reusable recipe: when one branch must be finished before the next one starts, keep the branches still to try on a stack. When the structure can loop back on itself, keep a visited set.
