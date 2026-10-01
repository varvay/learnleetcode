class Solution:
    def uniqueOccurrences(self, arr: list[int]) -> bool:
        unique, counter = {} , {}

        for num in arr:
            if num not in counter:
                counter[num] = 1
            else:
                counter[num] += 1

        for num in counter:
            if counter[num] not in unique:
                unique[counter[num]] = num
            elif unique[counter[num]] != num:
                return False

        return True
