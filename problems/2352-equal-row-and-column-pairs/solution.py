class Solution:
    def equalPairs(self, grid: list[list[int]]) -> int:
        n = len(grid) # n x n

        rows, cols = {}, {}

        for i in range(n):
            token = "_".join(str(num) for num in self.row(grid, i))
            if token not in rows:
                rows[token] = 1
            else:
                rows[token] += 1

            token = "_".join(str(num) for num in self.col(grid, i))
            if token not in cols:
                cols[token] = 1
            else:
                cols[token] += 1

        return sum(rows[token] * cols[token] for token in rows if token in cols)

    def row(_, grid: list[list[int]], i: int) -> list[int]:
        return grid[i]

    def col(_, grid: list[list[int]], i: int) -> list[int]:
        return [col[i] for col in grid]
