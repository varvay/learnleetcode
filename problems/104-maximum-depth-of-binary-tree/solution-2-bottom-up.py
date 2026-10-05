# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: TreeNode | None) -> int:
        return self.visit(root)

    def visit(self, node: TreeNode | None) -> int:
        if node:
            return 1 + max(self.visit(node.right), self.visit(node.left))
        else:
            return 0
