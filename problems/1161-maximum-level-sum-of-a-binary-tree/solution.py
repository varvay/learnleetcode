# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxLevelSum(self, root: TreeNode | None) -> int:
        if not root:
            return 0

        queue, best, result = deque([(root, 1)]), root.val-1, 1

        temp_sum = 0
        while queue:
            current, level = queue.popleft()

            if current.left:
                queue.append((current.left, level+1))
            if current.right:
                queue.append((current.right, level+1))

            if not queue or queue[0][1] != level:
                temp_sum += current.val
                if temp_sum > best:
                    best = temp_sum
                    result = level
                temp_sum = 0
            else:
                temp_sum += current.val

        return result
