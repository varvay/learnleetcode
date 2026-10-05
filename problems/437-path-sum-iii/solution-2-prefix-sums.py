# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def pathSum(self, root: TreeNode | None, targetSum: int) -> int:
        counts = {0: 1}

        def visit(node: TreeNode | None, running: int) -> int:
            if not node:
                return 0
            running += node.val
            found = counts.get(running - targetSum, 0)
            counts[running] = counts.get(running, 0) + 1
            found += visit(node.left, running) + visit(node.right, running)
            counts[running] -= 1
            return found

        return visit(root, 0)
