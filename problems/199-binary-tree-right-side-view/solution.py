# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def rightSideView(self, root: TreeNode | None) -> list[int]:
        if not root:
            return []

        queue, result = deque([(root, 0)]), {0: root}

        while queue:
            current, depth = queue.popleft()

            if current.right:
                queue.append((current.right, depth+1))
                result.setdefault(depth+1, current.right)
            if current.left:
                queue.append((current.left, depth+1))
                result.setdefault(depth+1, current.left)

        return [node.val for node in result.values()]
