---
title: Let the map's meaning order the lines
---

| Name | Always means, when `visit(node, running)` is entered |
| --- | --- |
| `running` | the sum from the root down to `node`'s parent; after `running += node.val`, down to `node` itself |
| `counts[s]` | how many of `node`'s ancestors, plus the empty start before the root, have running sum `s` |
| `visit(...)` returns | how many target paths end somewhere in `node`'s subtree |

| Code | What happened | What it keeps true |
| --- | --- | --- |
| `counts = {0: 1}` | the walk hasn't started | the sum before the root counts once, so paths can start at the root |
| `running += node.val` | the walk stepped down to `node` | `running` is the sum from the root to `node` |
| `found = counts.get(running - targetSum, 0)` | each ancestor with that sum starts one target path ending here | `found` counts the paths that end at `node` |
| `counts[running] = counts.get(running, 0) + 1` | `node` becomes an ancestor of everything below it | its children see its sum |
| `found += visit(node.left, running) + visit(node.right, running)` | both subtrees are counted | `found` covers the whole subtree |
| `counts[running] -= 1` | the walk leaves `node` | the map describes the current path again, so a sibling never sees this node's sum |

**Why a count, not a set.** Two nodes on one path can share a running sum when the stretch between them adds up to 0, and each of them starts its own path. On the tree `[5, 3, 2, -3, null, null, null, 2]` with target 2, the left branch runs 5 → 3 → −3 → 2, and since 3 + (−3) = 0 the running sum comes back to 5: the root and the −3 both have it. At the bottom 2, with running sum 7, the lookup is `counts[5]`, which is 2: one path is 3 → −3 → 2 and the other is the 2 alone. Leaving the −3 then lowers `counts[5]` to 1, so the root's right child, another 2, still finds the root's 5 and counts itself. The answer is 3. A set that adds each sum and removes it on the way back finds only 1: it counts the shared 5 once, then deletes it when leaving the −3, although the root still holds it.

**Why look up before adding.** If `node`'s own sum were added first, a target of 0 would match it against itself and count an empty path. On the tree `[0, 0, 0]` with target 0, the order above finds the correct 5; adding first finds 8.

The method carries over: write down what the map describes, and every add has a matching remove at the point where that stops being true.
