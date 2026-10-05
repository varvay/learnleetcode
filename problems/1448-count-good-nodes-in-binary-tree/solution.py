# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        if not root:
            return 0

        stack, solution = [(root, root.val)], 0

        while stack:
            current, best = stack.pop()
            if current.right:
                stack.append((current.right, max(best, current.right.val)))
            if current.left:
                stack.append((current.left, max(best, current.left.val)))
            if current.val >= best:
                solution += 1

        return solution
