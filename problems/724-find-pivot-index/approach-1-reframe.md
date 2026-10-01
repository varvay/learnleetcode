---
title: Both sides come from one total
---

At any index, the left sum, the number itself, and the right sum add up to the total. So once the total is known, walking left to right gives both sides at every step: each number moves out of the right sum as the walk reaches it, and into the left sum one step later.

The numbers can be negative, so neither sum grows steadily, and a balance at one index says nothing about the next. Every index has to be checked in order. Scanning from the left makes the first balance found the leftmost pivot, which is the one the problem asks for.
