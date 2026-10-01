class Solution:
    def longestSubarray(self, nums: list[int]) -> int:
        left = zeros = best = 0

        for right, num in enumerate(nums):
            if num == 0:
                zeros += 1

            while zeros > 1:
                if nums[left] == 0:
                    zeros -= 1
                left += 1

            best = max(best, right - left)

        return best
