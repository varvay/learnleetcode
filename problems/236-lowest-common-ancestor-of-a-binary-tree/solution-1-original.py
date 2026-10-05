# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        def walk(found: int, node: 'TreeNode') -> tuple[int, 'TreeNode']:
            if not node:
                return (0, None)

            found_self = 1 if node.val == p.val or node.val == q.val else 0

            found_left, left_node = walk(found, node.left)

            if found_left == 2:
                return (2, left_node)

            if found_self == 1 and found_left == 1:
                return (2, node)

            found_right, right_node = walk(found, node.right)

            if found_right == 2:
                return (2, right_node)

            if found_self + found_left + found_right == 2:
                return (2, node)

            return (found_left+found_right+found_self, node)

        _, lca = walk(0, root)
        return lca
