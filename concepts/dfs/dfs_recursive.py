def dfs(graph: dict[str, list[str]], start: str) -> list[str]:
    visited = set()
    order = []

    def visit(node: str) -> None:
        visited.add(node)
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visit(neighbor)

    visit(start)
    return order
