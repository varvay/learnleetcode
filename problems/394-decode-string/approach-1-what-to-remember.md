---
title: What to remember at a "["
---

One question leads to the whole solution: what still has to be remembered when the loop reaches a `[`?

**1. Start from how the format is defined.** An encoded string is letters mixed with groups `k[...]`, and the inside of a group is itself an encoded string. That definition refers to itself, so decoding does too: decode(`k[X]`) = decode(`X`) repeated k times. That points straight at recursion: to decode a group, decode its inside first, then repeat it.

**2. Reading left to right, the count comes before its contents.** On `3[a2[c]]` the loop reads `3[` but can't know what to repeat until the matching `]`. So the current work has to be paused, the inside done, then the paused work picked up again. Groups nest, so the inside can contain its own `2[`, which pauses again.

**3. Pausing and resuming in reverse order means a stack.** The most recently paused group is always the next one to finish: in `3[a2[c]]`, the `2[` opened last and closes first. It's the same signal as in 2390 and 735: the most recent unfinished thing is the one dealt with next.

**4. What to save: whatever the inner work will overwrite.** While decoding the inside, the loop reuses `k` and `current`, so their outer values would be lost. Those two are exactly what has to be saved, and nothing else; the loop already tracks its own position in `s`. So the push is `(k, current)`, followed by a reset to start the inside fresh.

**5. At `]`, finish the inside and resume the outside.** `current` now holds the decoded inside. Pop the paused state, `repeat, before`, and combine: `before + current * repeat`. That result becomes `current` again, because the loop is back in the outer group and later letters keep appending to it. If another `]` follows, the same step repeats one level up.

**6. The stack is what recursion keeps for you.** In the recursive version from step 1, each call has its own local count and text, and the call stack holds the paused calls. The explicit stack holds the same thing: each `(k, current)` tuple is one paused call's local variables. Writing it as a loop makes that stack visible.

The reusable recipe: when a problem makes you pause work, handle something nested, then resume, use a stack. What to push is the state the nested part would overwrite.
