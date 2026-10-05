# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: ListNode | None) -> ListNode | None:
        prev, node = None, head
        while node:
            next_node = node.next
            node.next = prev
            prev = node
            node = next_node
        return prev
