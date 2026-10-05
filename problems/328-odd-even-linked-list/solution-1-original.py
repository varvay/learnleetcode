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

        while odd and odd.next and odd.next.next:

            odd.next = odd.next.next
            odd = odd.next

            even.next = odd.next
            even = even.next

        if even:
            even.next = None
        if odd:
            odd.next = even_start

        return head
