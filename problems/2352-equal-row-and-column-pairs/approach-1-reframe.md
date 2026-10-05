---
title: Group by sequence, then multiply
---

**1. Solve it by hand.** On LeetCode's example 2, compare each row with each column, number by number: row 0 equals column 0, and rows 2 and 3 both equal column 2. That is 3 pairs, found by n × n comparisons of n numbers each: O(n³).

**2. Ask what a pair really needs.** A row and a column pair up exactly when they read the same sequence. So instead of comparing them two at a time, give each sequence a name and compare names. Joining the numbers with a separator, as in `"2_4_2_2"`, gives that name: two sequences are equal exactly when their tokens are, because `_` never appears inside a number. A token is a string, so it can be a dict key.

**3. Count by token, rows and columns apart.** A pair is always one row with one column; two equal rows, or two equal columns, are not a pair. So rows and columns get a dict each: `rows[token]` says how many rows read it, `cols[token]` how many columns.

**4. Turn the counts into pairs.** A token held by `a` rows and `b` columns makes `a × b` pairs, since each of those rows pairs with each of those columns. Every pair has exactly one token, so adding `a × b` over all tokens counts each pair once. A token missing from either side adds 0.

The reusable recipe: to count matching pairs between two groups, give each item a key, count each group by key, and add the product of the two counts for every key.
