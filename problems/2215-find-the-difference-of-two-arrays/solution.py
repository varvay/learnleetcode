class Solution:
    def findDifference(self, nums1: list[int], nums2: list[int]) -> list[list[int]]:
        in1, in2 = {}, {}
        for x in nums1:
            in1[x] = True
        for x in nums2:
            in2[x] = True

        only1 = []
        for x in in1:
            if x not in in2:
                only1.append(x)

        only2 = []
        for x in in2:
            if x not in in1:
                only2.append(x)

        return [only1, only2]
