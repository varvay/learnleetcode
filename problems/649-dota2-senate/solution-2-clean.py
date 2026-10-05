class Solution:
    def predictPartyVictory(self, senate: str) -> str:
        remaining = {"R": senate.count("R"), "D": senate.count("D")}
        bans = {"R": 0, "D": 0}
        queue = deque(senate)

        while remaining["R"] and remaining["D"]:
            senator = queue.popleft()
            rival = "D" if senator == "R" else "R"
            if bans[senator]:
                bans[senator] -= 1
                remaining[senator] -= 1
            else:
                bans[rival] += 1
                queue.append(senator)

        return "Radiant" if remaining["R"] else "Dire"
