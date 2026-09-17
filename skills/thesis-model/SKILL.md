---
name: thesis-model
description: Decide how the business makes money and whether the arithmetic survives contact with a price, covering pricing, revenue shape, unit economics, channel cost and whether any moat exists. Use when setting or changing a price, choosing between subscription, usage, take-rate or one-off revenue, filling in a business model or lean canvas, sanity-checking unit economics, or answering "how will this make money". Also use when revenue exists but margin does not.
---

# Model

Owns `strategy/model.md` and the claims `price-clears-value`,
`unit-economics-work`, `channel-exists`, `reach-is-owned-or-decay-is-planned`,
`moat-or-honest-absence`.

Read [../DISCIPLINE.md](../DISCIPLINE.md) before writing anything.

## Fill the canvas last, never first

A model written before the problem, customer and offer stages is a wish list
with a grid drawn around it. If the founder wants to start here, ask what the
Problem box will say, and let the silence make the argument.

The worksheet is `canvases/one-page-model.md` in the repository. It lives there
rather than here because it adapts work released under ShareAlike terms, and
those terms travel with the file — copying its layout into this skill would
pull a copyleft obligation into MIT-licensed material. `canvases/ATTRIBUTION.md`
records the lineage and the reasoning. Read it before reproducing or renaming
anything from it.

Have the founder copy each box's confidence from the matching claim rather than
judging it afresh. A summary that upgrades a guess into a fact is worse than no
summary, and a nine-box grid is unusually good at doing exactly that.

## Price against their cost, never your effort

The most common pricing error is anchoring on what the work cost you to make.
Buyers do not care. Ask three questions in this order:

1. **What does this problem cost them per year?** Your price is a fraction of
   that number. If the founder does not know it, the price is arbitrary and you
   should say so.
2. **What is the next best alternative, priced?** You are compared to it whether
   you like it or not. Include "keep doing it manually" as an alternative with a
   real price in hours.
3. **What is the cheapest way they can say yes?** That is the top of the ladder,
   not the whole ladder. Founders conflate the entry price with the business.

## Choose the revenue shape deliberately

Each one buys a different company. Say the cost out loud, not just the benefit.

| Shape | Buys you | Costs you |
| --- | --- | --- |
| One-off fee | Cash now, simple sale | No compounding, permanent hunting |
| Subscription | Compounding revenue | Churn becomes your real product |
| Usage based | Aligns price with value | Revenue you cannot forecast |
| Take rate | Scales with their success | You need their volume before yours |
| Retainer | Predictable, high trust | Capped by your own hours |

A founder who picks subscription because that is what software does has not
chosen. Make them say which cost they are accepting.

## The dependency that keeps people honest

`unit-economics-work` depends on `price-clears-value` for a reason. A margin
computed from a price nobody has ever paid is arithmetic about fiction. Do not
mark the economics `indicated` on the strength of a spreadsheet; mark it when
money has moved.

Acquisition cost is the number founders skip. If it is unknown, write that it is
unknown rather than substituting an industry benchmark. An imported benchmark is
someone else's evidence for someone else's business.

## On the moat

`moat-or-honest-absence` accepts two answers and both are fine:

- Something that gets harder to copy over time: accumulating data, switching
  costs, a distribution position, a regulatory licence, genuine brand trust.
- An honest "nothing yet."

What it does not accept is a first-mover claim, a "we execute better" claim, or
a feature list. Early on, no moat is the normal condition. Pretending otherwise
is the only real error available here.

## Owned reach or a plan for its decay

`reach-is-owned-or-decay-is-planned` is in this stage because it is the claim
whose absence is most expensive, and it is almost never written down.

Ask which kind the channel is:

- **Borrowed** — marketplace placement, in-platform search, organic reach from
  an algorithm, word of mouth. The reach belongs to someone else, or to a pool
  with a bottom.
- **Owned** — a list you hold, a relationship you can contact directly, a
  partnership with terms in writing.

Borrowed reach is not a mistake. It is frequently the only channel a new
business can afford, and turning it down on principle is its own error. Two
things make it dangerous, and both are about timing rather than quality:

1. **It ends without notice.** Nobody sends a message when the ranking changes
   or the referral pool empties. The numbers taper, and months of planning are
   already resting on them.
2. **The decline looks like a performance problem.** Founders respond by
   working harder in a channel that has already closed, because the other
   explanation is harder to accept.

So if the answer is borrowed, the claim is only settled when there is an answer
to the second half: what is it being converted into, while it still works? A
borrowed channel with no conversion plan is a countdown with nobody watching
it.

## Evidence in this stage expires

The gate ships with `evidence_half_life_days: 120`. A `validated` claim here
goes stale after four months.

Put a `collected_at` date on every evidence entry, or the claim earns an
`undated-evidence` warning. And when something does go stale, re-measure it
rather than re-dating it. Re-dating without re-measuring makes the whole tool
lie, quietly, in the direction the founder was already hoping for.

## Watch for these

- **The price with no anchor.** Set by feel, defended by comparison to
  competitors whose costs and funding are unknown.
- **Channel cost that the price cannot carry.** A £30/month product sold by a
  founder on calls is not a business, it is a hobby with revenue.
- **Five channels in the plan.** One channel that demonstrably works beats five
  that might. Make them pick.
- **Costs that scale with revenue one-to-one.** Common in service businesses
  dressed as products. Name it early; it changes what the company can become.

## Handoff

Move to `thesis-evidence` once the riskiest number in this stage is identified.
Usually it is acquisition cost or willingness to pay, not the technology.
