# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def pairSum(self, head: ListNode | None) -> int:
        slow, fast = head, head
        while fast:
            slow = slow.next
            fast = fast.next.next

        prev = None
        while slow:
            next_node = slow.next
            slow.next = prev
            prev = slow
            slow = next_node

        best = 0
        front, back = head, prev
        while back:
            best = max(best, front.val + back.val)
            front = front.next
            back = back.next
        return best
