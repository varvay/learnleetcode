# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def oddEvenList(self, head: ListNode | None) -> ListNode | None:

        odd = head
        even = head.next if head else None
        even_start = even

        while odd.next and odd.next.next:
            tmp = odd.next

            odd.next = odd.next.next
            odd = odd.next

            even.next = tmp
            even = even.next

        if even:
            even.next = None
        odd.next = even_start

        return head
