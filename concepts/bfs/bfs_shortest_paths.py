from collections import deque


def shortest_paths(graph: dict[str, list[str]], start: str) -> dict[str, int]:
    distance = {start: 0}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in distance:
                distance[neighbor] = distance[node] + 1
                queue.append(neighbor)

    return distance
