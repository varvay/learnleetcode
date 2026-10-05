# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def pairSum(self, head: ListNode | None) -> int:
        slow, fast = head, head
        stack = []
        best = 0

        while fast:
            slow, fast = slow.next, fast.next.next

        while slow:
            stack.append(slow.val)
            slow = slow.next

        while stack:
            best = max(best, head.val+stack.pop())
            head = head.next

        return best
