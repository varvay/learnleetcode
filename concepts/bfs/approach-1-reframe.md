---
title: Nearest first, in a queue
---

**1. State the job.** Visit every node reachable from a start node, nearest first: every node one edge away, then every node two edges away, and so on. The graph is an adjacency list: `graph[node]` lists the node's neighbors.

**2. Walk it by hand and find where you get stuck.** Take the graph with edges A–B, A–C, B–D, B–E, C–F, E–F, starting at A. One edge away are B and C; two edges away are D and E, through B, and F, through C. Visiting B finds D and E, but they have to wait: C was found earlier and is nearer, so it goes first.

**3. Find what to remember.** The nodes found but not yet visited, in the order they were found. First found, first visited is a queue. It is depth-first search's loop with the stack swapped for a queue, and the walk goes wide instead of deep.

**4. See why the order is by distance.** The queue always holds nodes at some distance d, followed by nodes at distance d + 1. Taking a node at distance d adds only nodes at distance d + 1, at the back. So every node at distance d leaves before any node at d + 1.

**5. Mark a node when it is found.** F is found from C and again from E. Marking it visited when it joins the queue keeps it from joining twice. The first time a node is found is always through a shortest path, so nothing is lost.

**6. Check the cost.** Each node joins the queue once and each adjacency list is read once: O(V + E) time, and O(V) space for the queue and the visited set.

The reusable recipe: when the nearest answers matter first, such as the fewest steps or one level at a time, explore with a queue and mark each node when it is found.
