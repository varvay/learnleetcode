from collections import deque


def bfs(graph: dict[str, list[str]], start: str) -> list[str]:
    visited = {start}
    order = []
    queue = deque([start])

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order
