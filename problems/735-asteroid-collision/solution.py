class Solution:
    def asteroidCollision(self, asteroids: list[int]) -> list[int]:
        stack = []

        for i, num in enumerate(asteroids):
            asteroid = num
            while asteroid < 0 and stack and stack[-1] > 0:
                if abs(asteroid) == stack[-1]:
                    asteroid = 0 # ignore
                    stack.pop()
                elif abs(asteroid) > stack[-1]:
                    stack.pop()
                else:
                    asteroid = 0 # ignore

            if asteroid != 0:
                stack.append(asteroid)

        return stack
