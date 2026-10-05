---
title: The lowest node whose subtree holds both
---

**1. Restate the LCA.** The ancestors of a node are the nodes on its path up to the root, the node itself included. The lowest common ancestor of `p` and `q` is the deepest node that is an ancestor of both: the point where their two paths up first meet.

**2. Find it by hand and see where that gets stuck.** In LeetCode's first tree, with p = 5 and q = 1, the paths up are 5 → 3 and 1 → 3, so they meet at 3. With p = 5 and q = 4, the path up from 4 is 4 → 2 → 5 → 3, which passes through 5 itself, so the answer is 5. Tracing paths upward needs to know each node's parent, but a tree node knows only its children.

**3. Look from above instead.** A node is a common ancestor of `p` and `q` exactly when its subtree contains both of them. So the LCA is the lowest node whose subtree holds both: walking back up from the bottom, the first node where both have been found.

**4. Find what each call must report.** How many of `p` and `q` its subtree holds: 0, 1 or 2. A node's count is its children's counts plus 1 if it is `p` or `q` itself, so the children must finish first. It is a postorder walk, like 104's depth.

**5. Stop growing the answer once it is found.** The first node whose count reaches 2 is the LCA. Every node above it also holds both, but none is lower, so they pass the answer up unchanged. `solution-1-original.py` also skips the right subtree when the node and its left subtree already hold both.

**6. Check the cost.** Each node is visited at most once: O(n) time, and O(h) for the recursion.

The reusable recipe: when the answer is the lowest node whose subtree has some property, have each call report that property upward, and fix the answer at the first node where it holds.
