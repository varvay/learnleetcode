# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def longestZigZag(self, root: TreeNode | None) -> int:
        if not root:
            return 0

        stack, best = [(root, 0, 0)], 0

        while stack:
            current, left, right = stack.pop()

            best = max(best, left, right)

            if current.right:
                stack.append((current.right, right+1, 0))
            if current.left:
                stack.append((current.left, 0, left+1))

        return best
