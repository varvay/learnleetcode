---
title: Let the return value's meaning write the function
---

| Code | Always means |
| --- | --- |
| `visit(node)` in `solution-2-bottom-up.py` | returns the depth of the subtree rooted at `node`: the nodes on its longest downward path |
| `visit(node, depth)` in `solution-1-top-down.py` | `depth` counts the nodes above `node`; returns the deepest count any path below it reaches |
| `(current, depth)` on the stack in `solution-3-stack.py` | `depth` counts the nodes from the root down to `current`; `best` is the largest depth popped so far |

Each case of the bottom-up `visit` is the smallest answer that keeps its meaning true:

| Case | What it means | Code |
| --- | --- | --- |
| `node` is `None` | an empty subtree has no nodes | `return 0` |
| `node` exists | the node itself, plus the deeper of its two subtrees | `return 1 + max(self.visit(node.right), self.visit(node.left))` |

`maxDepth(root)` is `visit(root)`: the whole tree is the subtree rooted at the root, and an empty tree falls into the first case.

Neither version needs a visited set: each node is reached only from its parent, so no node is visited twice. The order of the two calls inside `max` doesn't matter either; walking the right subtree first gives the same answer as the left.

The method carries over: write down what the function returns for any node, then the empty case and the combining step each follow from that meaning.
