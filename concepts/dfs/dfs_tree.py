# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
def preorder(root: TreeNode | None) -> list[int]:
    order = []

    def visit(node: TreeNode | None) -> None:
        if not node:
            return
        order.append(node.val)
        visit(node.left)
        visit(node.right)

    visit(root)
    return order
