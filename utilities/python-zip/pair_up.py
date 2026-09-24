def pair_up(a, b):
    pairs = []
    for left, right in zip(a, b):
        pairs.append((left, right))
    return pairs
