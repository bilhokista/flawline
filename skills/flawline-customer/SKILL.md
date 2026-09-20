---
name: flawline-customer
description: Turn customer conversations into a segment definition, a picture of what people are trying to get done, and a persona built only from things that were actually said. Use when defining who a product is for, choosing which segment to serve first, writing or auditing a persona or ICP, planning customer interviews, or turning interview transcripts into claims. Also use when someone says "our users want" without being able to name a user.
---

# Customer

Owns `strategy/customer.md` and the claims `segment-is-reachable`,
`what-they-want-done`, `what-gets-in-the-way`, `what-good-looks-like`,
`who-can-say-yes`.

Read [../DISCIPLINE.md](../DISCIPLINE.md) before writing anything.

## Start from the arena the advantage stage named

If `context-values-it` is settled, the segment is already half chosen: pick
the people who pay for the founder's particular oddity rather than the ones who
merely tolerate it. Read `strategy/advantage.md` before narrowing.

## Narrow until it is uncomfortable

A segment is well defined when you can do one of two things: list ten real
names, or name one place they reliably gather. "SMBs", "developers" and
"marketing teams" fail both tests and therefore are not segments.

Push the founder through the narrowing, and let them feel the discomfort — it is
the point. Ten named people is a market you can start in; a category is a market
you can only describe.

## Find the segment before you ask anyone

A founder who cannot list ten names usually cannot invent them either, and
sitting them down to guess produces a segment made of adjectives. Aggregate
search volume is the cheapest way out: the queries people already type for this
need, the words they use, and how the volume splits by place, season or role.

Record it as `search-demand`, with the query, the tool and the date range, so a
stranger can run it again. A cluster of queries is a candidate segment and the
vocabulary to approach it with — which is what the interviews are for.

Public questions do the other half. A thread on Reddit, Quora or a local forum
where somebody asked for a way out of this says, in their own words, what they
were trying to do — which a query never does. Record it as `forum-question`,
one entry per thread with its URL and date. Count threads, not replies: a post
with two hundred comments is one person with one problem and an audience.

Census figures are the trap here, so name it before the founder reaches for
them. `official-statistics` buys nothing, and not because the source is weak —
it is the best-measured thing available. It counts populations, and this stage
is about behaviour. "1.2 million households in this regency" cannot become "they
cannot find a builder they trust", and the sentence that walks from one to the
other is the oldest slide in the deck. It can still refute: if the real
population is a fortieth of what the thesis assumed, write `refuted` and move
on.

It is a starting point and not a finish. A query establishes that people are
looking, never what the problem costs them or what they would pay, so it
reaches `indicated` and stops. The names still have to come from somewhere.

## Design the interviews before running them

The single rule: **ask about the last time, never about the future.**

People are unreliable narrators of their intentions and reliable narrators of
their behaviour. "Would you use a tool that..." returns a yes that costs nothing
and means nothing.

Ask instead:

- "Walk me through the last time this came up." → behaviour, not opinion
- "What did you do next?" → the existing bad solution, which is your real
  competitor
- "What did that cost you?" → the pain, in their units rather than yours
- "Who else got pulled in?" → the buyer and the veto
- "What have you already tried?" → what you are displacing, and why it failed
- "What would have had to be true for you to fix this properly?" → the gate
- "What happened the last time you bought something like this?" → the actual
  purchase process, which is usually worse than the founder imagines

Then stop talking. The useful material comes in the silence after a question the
founder would have rushed to fill.

## Reading the transcripts

Go through them and mark three things, using their words verbatim:

- **What they are trying to get done.** Progress they want. No mention of any
  product, including the competitors'.
- **What gets in the way.** Rank these. If everything is a blocker, the
  listening was not close enough. One obstacle dominates; find it.
- **What good looks like.** How they would know it went well — a number, a
  moment, or a sentence they would say to a colleague.

If the same phrase appears in three separate transcripts, that phrase belongs in
the positioning later. Note it.

## The persona, once it has been earned

Build it only from what was said. Every row must be traceable to a transcript
you can cite in an `evidence` block. A persona assembled from imagination is a
mirror; the founder will see their own assumptions in it and feel validated.

| Field | Answer | Source |
| --- | --- | --- |
| Role and what they are measured on | | |
| Trigger that starts them looking | | |
| What they do today instead | | |
| Their words for the problem | | |
| Who must approve the spend | | |
| What would make them say no | | |

Refuse to fill a row from inference. An empty row is information; a guessed row
is contamination.

## Sell to the scorecard

`who-can-say-yes` asks what the approver is measured on, not what they care
about. People approve what makes their own number look better. A problem that
does not touch anyone's scorecard does not get budget, however real it is.

## This whole stage stops at "indicated"

`flawline check` will not let an interview-backed claim reach `validated`,
however many interviews were run. Tell the founder this early, before they
invest hope in hitting a number.

The reason is narrow. Nothing was at stake when the answer was given. An
interview can establish that a problem exists, what it costs, who is involved
and what they do today — the most valuable research available at this stage.
What it cannot establish is that anyone will part with money, because being
asked costs nothing and paying does not.

So `indicated` is the honest ceiling here, and that is a finding rather than a
failure. The same applies to surveys, waitlists and demos that went well.
Engagement — likes, saves, views, warm replies — buys nothing at all.

## Watch for these

- **The enthusiastic non-buyer.** Loves the idea, has no budget, will take every
  call. Good for learning, dangerous for confidence.
- **Friends and network.** Not customer evidence. Do not count them in `n`.
- **The segment defined by technology.** "Companies using Postgres" is a
  filter, not a segment. Segments share a situation, not a stack.
- **Unreachable segments.** If there is no channel, every later stage is
  academic. Say so before the offer stage, not after.

## Handoff

Move to `flawline-offer` once `what-gets-in-the-way` has a ranked first entry with
real signal behind it. The offer stage needs one named obstacle to aim at; give
it the obstacle, not a list.
