---
title: Let the count's meaning write the five exits
---

| Value | Always means |
| --- | --- |
| `walk(found, node)` returns `(count, answer)` | `count` is how many of `p` and `q` are in `node`'s subtree; when `count` is 2, `answer` is their LCA |
| `found_self` | 1 when `node` is `p` or `q`, otherwise 0 |

Each exit keeps that meaning true:

| Code | What it means | Returns |
| --- | --- | --- |
| `if not node: return (0, None)` | an empty subtree holds neither | count 0 |
| `if found_left == 2` | both are in the left subtree, and its LCA is already known | the left answer, unchanged |
| `if found_self == 1 and found_left == 1` | this node is one of them, and the other is in its left subtree | this node; the right subtree is never walked |
| `if found_right == 2` | both are in the right subtree | the right answer, unchanged |
| `if found_self + found_left + found_right == 2` | the two are split across this node: one in each subtree, or this node and one in the right | this node |
| `return (found_left+found_right+found_self, node)` | fewer than two so far | the count; `node` is a placeholder, read only when the count is 2 |

`found` is passed down but never read. `node.val == p.val` relies on LeetCode's guarantee that values are unique; `node is p` compares the nodes themselves.

`solution-2-short.py` packs the same meaning into one returned node: `None` for "neither", `p` or `q` for "one of them", the LCA for "both". It stops at `p` or `q` without searching below, which is safe: if the other node is below, this node is the LCA anyway, and if not, the split higher up finds it.

The method carries over: give each call's return value one meaning, then every exit is a way that meaning can come true.
