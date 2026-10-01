class Solution:
    def closeStrings(self, word1: str, word2: str) -> bool:
        if len(word1) != len(word2):
            return False

        d1, d2 = {}, {} ## key: token, val: count
        c1, c2 = {}, {} ## key: count, val: occurrence

        for token in word1:
            if token not in d1:
                d1[token] = 1
            else:
                d1[token] += 1

        for token in word2:
            if token not in d2:
                d2[token] = 1
            else:
                d2[token] += 1

        for token in d1:
            if d1[token] not in c1:
                c1[d1[token]] = 1
            else:
                c1[d1[token]] += 1

        for token in d2:
            if d2[token] not in c2:
                c2[d2[token]] = 1
            else:
                c2[d2[token]] += 1

        for token in d1:
            if token not in d2:
                return False

        for token in d2:
            if token not in d1:
                return False

        for count in c1:
            if count not in c2:
                return False
            elif c1[count] != c2[count]:
                return False

        for count in c2:
            if count not in c1:
                return False
            elif c2[count] != c1[count]:
                return False

        return True
