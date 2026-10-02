class Solution:

    def decodeString(self, s: str) -> str:
        stack = []
        current = ""
        k = 0

        for token in s:
            if token.isdigit():
                k = k * 10 + int(token)
            elif token == "[":
                stack.append((k, current))
                k, current = 0, ""
            elif token == "]":
                repeat, before = stack.pop()
                current = before + current * repeat
            else:
                current += token

        return current
