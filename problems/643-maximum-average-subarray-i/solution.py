class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        window = best = sum(nums[:k])
        for leaving, entering in zip(nums, nums[k:]):
            window += entering - leaving
            best = max(best, window)
        return best / k
