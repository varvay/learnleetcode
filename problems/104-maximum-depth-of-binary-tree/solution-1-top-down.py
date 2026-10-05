# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: TreeNode | None) -> int:
        return self.visit(root, 0)

    def visit(self, node: TreeNode | None, depth: int) -> int:
        if node:
            return max(self.visit(node.right, depth+1), self.visit(node.left, depth+1))
        else:
            return depth
