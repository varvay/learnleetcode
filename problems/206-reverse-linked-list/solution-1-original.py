# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: ListNode | None) -> ListNode | None:
        new_head, _ = self.reverse(head, None)

        return new_head

    def reverse(self, to_be_head: ListNode, to_be_tail: ListNode | None) -> tuple[ListNode | None, ListNode | None]:
        reversed_head = to_be_head
        if not to_be_head:
            return None, to_be_tail
        elif to_be_head.next:
            reversed_head, reversed_tail = self.reverse(to_be_head.next, to_be_head)
            reversed_tail.next = to_be_head

        to_be_head.next = to_be_tail

        return reversed_head, to_be_tail
