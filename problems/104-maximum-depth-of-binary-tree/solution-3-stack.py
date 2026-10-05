# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: TreeNode | None) -> int:
        if not root:
            return 0

        stack = [(root, 1)]
        best = 0
        while stack:
            current, depth = stack.pop()
            best = max(best, depth)
            if current.left:
                stack.append((current.left, depth+1))
            if current.right:
                stack.append((current.right, depth+1))

        return best
