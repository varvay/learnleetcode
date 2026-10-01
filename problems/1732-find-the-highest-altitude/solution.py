class Solution:
    def largestAltitude(self, gain: list[int]) -> int:
        s = m = 0
        for _, g in enumerate(gain):
            s = s+g
            m = max(m, s)
        return m
