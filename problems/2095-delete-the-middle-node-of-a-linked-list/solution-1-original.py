# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def deleteMiddle(self, head: ListNode | None) -> ListNode | None:
        # mid_cursor, cursor
        # 0, 0: skip -> 0, 0
        # 0, 1: move -> 1, 1
        # 1, 2: skip -> 1, 2
        # 1, 3: move -> 2, 3
        # 2, 4: skip -> 2, 4
        # 2, 5: move -> 3, 5
        cursor, counter, mid_index, prev_cursor, mid_cursor = head, 0, 0, head, head

        if not head.next:
            return None

        while cursor:
            if counter % 2 != 0:
                mid_index += 1
                prev_cursor = mid_cursor
                mid_cursor = mid_cursor.next
            counter += 1
            cursor = cursor.next

        prev_cursor.next = mid_cursor.next

        return head
