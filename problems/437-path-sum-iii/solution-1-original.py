# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def pathSum(self, root: TreeNode | None, targetSum: int) -> int:
        if not root:
            return 0

        root_stack, solution = [root], 0

        while root_stack:
            current_root = root_stack.pop()
            if current_root.right:
                root_stack.append(current_root.right)
            if current_root.left:
                root_stack.append(current_root.left)

            # stack tuple of tree node and sum from current root until current observer
            observer_stack = [(current_root, current_root.val)]

            while observer_stack:
                current_observer, observer_sum = observer_stack.pop()
                if observer_sum == targetSum:
                    solution += 1
                if current_observer.right:
                    sum = observer_sum+current_observer.right.val
                    observer_stack.append((current_observer.right, sum))
                if current_observer.left:
                    sum = observer_sum+current_observer.left.val
                    observer_stack.append((current_observer.left, sum))

        return solution
