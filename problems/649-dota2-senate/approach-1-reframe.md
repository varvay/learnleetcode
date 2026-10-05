---
title: Ban the rival who votes next
---

**1. Decide whom to ban.** Every rival still in the vote will get a turn and ban one of yours, unless banned first. The rival whose turn comes soonest strikes first, so ban that one. On RDRDD, R0 bans D1 and R2 bans D3, so neither gets a turn. D4 then bans R0, and in the next round R2 bans D4: Radiant wins, two against three. If R0 bans D4 instead, D1 votes right away and bans R2, and Dire wins.

**2. Run it by hand and find where one pass gets stuck.** In that run D4 bans R0, who already voted this round, and R2 votes a second time. The vote goes round until one party is gone. Each ban has to find its target by looking ahead past the senators already banned, wrapping round the end: up to n steps per ban.

**3. Find what a ban has to remember.** A ban only says that the next senator of that party to come up loses their turn. So it needs no target yet: count it, `bans["D"] += 1`, and settle it when a Dire senator comes up. Whoever comes up while their party has a ban waiting is exactly the senator it was meant for. Bans against one party are interchangeable, so one count per party is enough.

**4. Let the turn order pick the data structure.** Senators who keep their vote take turns in the same order every round: the one at the front votes, then waits behind everyone else. First in, first out: a queue. Pop the front, then append a senator who voted and drop one who was banned.

**5. Decide when to stop.** Once a party has no senators left, the other side wins. Count each party's senators and stop when one count reaches zero.

**6. Check the cost.** Each turn either removes a senator, at most n times in all, or casts a ban that removes one later. On every senate of up to 14 senators the vote ends within 2n turns, so the time is O(n), and the queue takes O(n) space.

The reusable recipe: when players take turns in a fixed cycle, keep them in a queue, popping the front and appending them back while they are still in. When an action hits "the next one of a kind", count it as pending and settle it when that kind comes up.
