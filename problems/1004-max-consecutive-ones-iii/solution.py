class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        left = zeros = best = 0
        for right, num in enumerate(nums):
            if num == 0:
                zeros += 1
            while zeros > k:
                if nums[left] == 0:
                    zeros -= 1
                left += 1
            best = max(best, right - left + 1)
        return best
