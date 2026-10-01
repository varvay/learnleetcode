---
title: Only membership matters
---

The answer depends only on which values each array contains. Order, position, and how often a value repeats change nothing, so each array can be reduced to its distinct values first.

A hashmap does that reduction: its keys are unique, so writing a repeated value again leaves one key. It also answers "does the other array contain x?" with a hash lookup in constant time on average, where scanning the other array would cost its whole length.

Looping over a map's keys, rather than over the original array, makes each value come up once, which keeps the output lists distinct.
