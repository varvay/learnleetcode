# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def pairSum(self, head: ListNode | None) -> int:
        ls, cursor, best = deque([]), head, 0

        while cursor:
            ls.append(cursor.val)
            cursor = cursor.next

        while ls:
            left, right = ls.popleft(), ls.pop()
            best = max(best, left+right)

        return best
