---
title: What the operations keep
---

Each operation changes something, so the useful question is what neither can change.

- **Swapping two characters** rearranges the word, so order never matters. Only how often each letter appears does.
- **Transforming one letter into another, and back,** trades the counts of two letters that are already in the word. The set of letters stays the same, and so does the list of counts; only which letter holds which count changes.

So two words are close exactly when they use **the same letters** and have **the same counts, ignoring which letter has which**. Both conditions are also enough: the second operation hands each count to the right letter, and the first puts the letters in order. Equal length follows from equal counts, which makes it a cheap first check.

Comparing "the same counts, ignoring letters" means comparing two collections of counts. A second hashmap per word, from a count to how many letters have it, turns that into a key-by-key comparison.
