# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def leafSimilar(self, root1: TreeNode | None, root2: TreeNode | None) -> bool:
        stack1, stack2 = [root1], [root2]

        while stack1:
            current1 = stack1.pop()
            if current1.right:
                stack1.append(current1.right)
            if current1.left:
                stack1.append(current1.left)
            if not current1.left and not current1.right:
                if not stack2:
                    return False
                while stack2:
                    current2 = stack2.pop()
                    if current2.right:
                        stack2.append(current2.right)
                    if current2.left:
                        stack2.append(current2.left)
                    if not current2.left and not current2.right:
                        if current1.val != current2.val:
                            return False
                        else:
                            break

        return not stack2
