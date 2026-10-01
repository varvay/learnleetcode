---
title: Count, then look for a repeated count
---

The question has two layers. First, how often does each number appear? A hashmap from number to count answers that in one pass. Second, do any two numbers share a count? That is the same "has this been seen before?" question, asked of the counts instead of the numbers.

So a second hashmap, keyed by count, answers the second layer: each count is claimed by the first number that has it, and a count that is already claimed means two numbers share it. The scan can return `False` at the first such count, without checking the rest.
