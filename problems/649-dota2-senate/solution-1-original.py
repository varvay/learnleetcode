class Solution:
    def predictPartyVictory(self, senate: str) -> str:
        # ban_r: 0, ban_d: 0, queue: [R, R, D, D, D]
        # ban_r: 0, ban_d: 1, queue: [R, D, D, D, R]
        # ban_r: 0, ban_d: 2, queue: [D, D, D, R, R]
        # ban_r: 0, ban_d: 1, queue: [D, D, R, R]
        # ban_r: 0, ban_d: 0, queue: [D, R, R]
        # ban_r: 1, ban_d: 0, queue: [R, R, D]
        # ban_r: 0, ban_d: 0, queue: [R, D]
        # ban_r: 0, ban_d: 1, queue: [D, R]
        # ban_r: 0, ban_d: 0, queue: [R]


        ban_r = ban_d = 0
        queue = deque([senator for senator in senate])

        while True:
            if ban_r > len(senate) or ban_d > len(senate):
                break
            if queue[0] == "R":
                if ban_r > 0:
                    queue.popleft()
                    ban_r -= 1
                else:
                    queue.popleft()
                    queue.append("R")
                    ban_d += 1
            elif queue[0] == "D":
                if ban_d > 0:
                    queue.popleft()
                    ban_d -= 1
                else:
                    queue.popleft()
                    queue.append("D")
                    ban_r += 1

        if queue[0] == "R":
            return "Radiant"
        else:
            return "Dire"
