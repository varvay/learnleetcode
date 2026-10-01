class Solution:
    def removeStars(self, s: str) -> str:
        stack = []

        for token in s:
            if token == "*":
                stack.pop()
            else:
                stack.append(token)

        return "".join(stack)
