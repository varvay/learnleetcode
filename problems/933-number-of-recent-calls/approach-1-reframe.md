---
title: The oldest ping is the first to expire
---

**1. Answer a few pings by hand.** Pings arrive at 1, 100, 3001, 3002. At 3001 the window is [1, 3001], so all three count. At 3002 the window is [2, 3002]: the ping at 1 has fallen out, and it will never count again, because later windows only start later.

**2. Find what must be remembered between pings.** Every ping still inside the window, since each later call needs to know how many there are. Pings outside it can be forgotten for good.

**3. Notice which pings leave, and in what order.** Times strictly increase, so pings arrive oldest first, and the oldest is always the first to fall out of the window. First in, first out: that is a queue. Each ping joins at the back, and expired pings leave from the front.

**4. Answer with the queue's length.** Once the expired pings are gone, everything in the queue lies in [t − 3000, t], so its length is the answer.

**5. Check the cost.** A single call may drop many pings, but each ping is added once and dropped at most once, so every call costs O(1) on average. Times are whole milliseconds and strictly increasing, so at most 3001 pings fit in a window, and the queue never grows past that.

The reusable recipe: for "how many events in the last T", keep the events in a queue and drop from the front everything older than the window; the queue's length is the count.
