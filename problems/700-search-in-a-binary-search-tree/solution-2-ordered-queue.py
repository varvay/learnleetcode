# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def searchBST(self, root: TreeNode | None, val: int) -> TreeNode | None:
        if not root:
            return None

        queue = deque([root])

        while queue:
            current = queue.popleft()

            if val < current.val and current.left:
                queue.append(current.left)
            if val > current.val and current.right:
                queue.append(current.right)

            if current.val == val:
                return current

        return None
