---
title: Let the return value's meaning write the cases
---

In `solution-2-successor.py`, each call has one meaning:

| Call | Always means |
| --- | --- |
| `self.deleteNode(root, key)` | returns the root of this subtree after `key` is removed from it |

So every case answers "what is the new root of this subtree":

| Case | What it means | Code |
| --- | --- | --- |
| `not root` | empty subtree, `key` is absent | `return None` |
| `key < root.val` | `key` can only be on the left | `root.left = self.deleteNode(root.left, key)`: the left subtree's new root becomes the left child |
| `key > root.val` | only on the right | the mirror image |
| found, `not root.left` | zero or one child, on the right | `return root.right`: the right subtree, possibly `None`, takes this place |
| found, `not root.right` | one child, on the left | `return root.left` |
| found, two children | the successor is the smallest key on the right | copy `successor.val` into `root`, then delete the successor from `root.right` |
| any other path | this node stays | `return root` |

Assigning the result back, `root.left = …`, is what rewires the parent: the parent never needs tracking, because the call that removed something returns the replacement to its parent's assignment.

`solution-1-original.py` reaches the same rewiring by tracking the parent and the side as a tuple, `(node, None)` for "on its left" and `(None, node)` for "on its right", and `attachParent` sets that one link. Its variable `leaf` is the rightmost node of the left subtree, which has no right child but can have a left one.

The method carries over: let each call return the new root of its subtree, and the parent's link fixes itself by assignment.
