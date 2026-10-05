---
title: A path is the difference of two running sums
---

**1. Restate what is counted.** Downward paths: they start at any node and end at any node below it, or at the start itself. Count those whose values add up to `targetSum`.

**2. Count by hand and find the repeated work.** The direct way, `solution-1-original.py`, starts a walk at every node and keeps a running sum on the way down. In LeetCode's first example, 3 under 5 under 10 gets added again for every node above it that starts a walk. A node at depth d is re-added d times, so the total is O(n · h): O(n²) on a chain.

**3. Reframe one path as a subtraction.** Take the running sum from the root down to each node. For an ancestor A and a node X below it, the path from just under A down to X sums to `running(X) − running(A)`. So a path ending at X sums to the target exactly when some ancestor's running sum is `running(X) − targetSum`. It is subarray-sum-equals-k, applied to each root-to-node path.

**4. Find what to remember.** For each running sum, how many nodes on the current path have it: a hash map from sum to count. Seed it with `{0: 1}`, the sum before the root, so a path starting at the root itself is counted.

**5. Keep branches apart.** When the walk leaves a node, that node is no longer an ancestor of what comes next, so its running sum must come out of the map. Add it on the way down and remove it on the way back up, so the map always describes exactly the current root-to-node path.

**6. Check the cost.** Each node does one lookup and two updates: O(n) time. The map holds at most one entry per node on the current path, and the recursion is as deep as the tree: O(h) space.

The reusable recipe: to count stretches that sum to a target, look up `running − target` among the earlier running sums in a hash map. On a tree, add each sum on the way down and remove it on the way back, so the map follows the current path.
