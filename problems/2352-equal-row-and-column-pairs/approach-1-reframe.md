---
title: A whole row as one key
---

A row and a column are equal when they hold the same numbers in the same order. Joining a sequence's numbers with a separator, as in `"2_4_2_2"`, gives it a token: two sequences are equal exactly when their tokens are, because `_` never appears inside a number. A token is a string, so it can be a dict key.

That turns the question around. Instead of comparing every row with every column, count how many rows and how many columns have each token, then work out the pairs from those counts.

A pair is always one row with one column; two equal rows, or two equal columns, are not a pair. So rows and columns get a dict each: a token held by `a` rows and `b` columns makes `a × b` pairs, and the answer adds that product over every token.
