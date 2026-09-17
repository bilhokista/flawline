---
name: thesis-customer
description: Turn customer conversations into a segment definition, a picture of what people are trying to get done, and a persona built only from things that were actually said. Use when defining who a product is for, choosing which segment to serve first, writing or auditing a persona or ICP, planning customer interviews, or turning interview transcripts into claims. Also use when someone says "our users want" without being able to name a user.
---

# Customer

Owns `strategy/customer.md` and the claims `segment-is-reachable`,
`what-they-want-done`, `what-gets-in-the-way`, `what-good-looks-like`,
`who-can-say-yes`.

Read [../DISCIPLINE.md](../DISCIPLINE.md) before writing anything.

## Narrow until it is uncomfortable

A segment is well defined when you can do one of two things: list ten real
names, or name one place they reliably gather. "SMBs", "developers" and
"marketing teams" fail both tests and therefore are not segments.

Push the founder through the narrowing, and let them feel the discomfort — it is
the point. Ten named people is a market you can start in; a category is a market
you can only describe.

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

## Watch for these

- **The enthusiastic non-buyer.** Loves the idea, has no budget, will take every
  call. Good for learning, dangerous for confidence.
- **Friends and network.** Not customer evidence. Do not count them in `n`.
- **The segment defined by technology.** "Companies using Postgres" is a
  filter, not a segment. Segments share a situation, not a stack.
- **Unreachable segments.** If there is no channel, every later stage is
  academic. Say so before the offer stage, not after.

## Handoff

Move to `thesis-offer` once `what-gets-in-the-way` has a ranked first entry with
real signal behind it. The offer stage needs one named obstacle to aim at; give
it the obstacle, not a list.
