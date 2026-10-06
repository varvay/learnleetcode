# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def deleteNode(self, root: TreeNode | None, key: int) -> TreeNode | None:
        if not root:
            return None

        result, node, parent = root, root, (None, None)

        while node and node.val != key:
            if key < node.val:
                parent = (node, None)
                node = node.left
            else:
                parent = (None, node)
                node = node.right

        if not node:
            return root

        def attachParent(target: TreeNode | None, parent: tuple[TreeNode | None], result: TreeNode | None) -> TreeNode | None:
            left, right = parent
            if left:
                left.left = target
                return result
            elif right:
                right.right = target
                return result
            else:
                return target

        if not node.left and not node.right:
            return attachParent(None, parent, result)
        elif node.left and not node.right:
            return attachParent(node.left, parent, result)
        elif node.right and not node.left:
            return attachParent(node.right, parent, result)
        else:
            result = attachParent(node.left, parent, result)
            leaf = node.left
            while leaf.right:
                leaf = leaf.right

            leaf.right = node.right

        return result
