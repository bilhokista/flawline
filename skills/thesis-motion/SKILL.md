---
name: thesis-motion
description: Get from zero to a repeatable sale, covering go-to-market sequencing, founder-led selling, objection handling, and hiring against the actual bottleneck. Use when planning a launch or go-to-market, writing outreach or a sales script, preparing for sales calls, handling recurring objections, deciding whether to spend on paid acquisition, or working out which role to hire next. Also use when leads arrive and nothing closes.
---

# Motion

Owns `strategy/motion.md` and the claims `first-channel-proven`,
`someone-unrelated-paid`, `sale-is-repeatable`, `org-matches-the-bottleneck`.

Read [../DISCIPLINE.md](../DISCIPLINE.md) before writing anything.

## Go to market is a sequence

1. **Reach one stranger.** Not the network. A stranger is the only honest test
   of the position, because nobody is being kind to you.
2. **Repeat it by hand.** Same channel, same pitch, ten times. Founder-led and
   deliberately unautomated.
3. **Write down what worked.** Exact words, objections, order.
4. **Only then spend money.** Paid acquisition multiplies a working motion and
   accelerates a broken one at identical cost.

Jumping to step four is the most expensive mistake available. If the founder
wants to start with ads, ask what the ad will say and whose retelling proved the
sentence works.

## What actually proves a channel, ranked

By how hard each one is to explain away:

1. **Someone arrived unprompted and bought.** Nothing you pushed accounts for
   it. Record it as `method: inbound-unprompted`; it is the only signal short
   of repeat revenue that cannot be talked into meaning something it does not.
2. **Acquisition cost held steady across two separate periods.** One good month
   is variance. Two is a pattern. One month is the number founders quote.
3. **A second purchase from the same customer.** The value landed, not just the
   pitch.
4. **A first payment from a stranger.** The floor, and routinely mistaken for
   the ceiling.

Below that line — enthusiasm, saved posts, a proposal request, a call that went
well — is not channel evidence, and `thesis-os check` will refuse to let it
carry a `validated` claim.

Note which channel it was and whether its reach was owned or borrowed. A
borrowed channel working right now is on a clock you cannot read.

## `someone-unrelated-paid` is the honest line

Friends, ex-colleagues, the investor's portfolio company and the founder's old
employer do not count. They are buying the founder, not the offer, and the
signal is unrecoverable.

Hold this line even when it is unwelcome. A founder who believes they have
traction from five friendly sales will make decisions — hires, spend, a
roadmap — on a foundation that is not there.

## Selling, for people who do not think of themselves as salespeople

The job is diagnosis, not persuasion. The research is already done; the call is
where you find out whether this particular person has the problem.

- **Open with their situation.** "You mentioned X happens every month. Still
  true?" Not a product introduction.
- **Let them say no early.** A fast no is a gift. A slow maybe is the outcome
  that actually costs you — weeks of follow-up and a distorted pipeline.
- **Quantify with them, not at them.** Ask what it costs. Do not tell them what
  it costs; they will spend the rest of the call defending a smaller number.
- **Name the price plainly and then stop talking.** The silence is not an
  objection. Founders discount into it and lose margin for nothing.
- **Write every objection down verbatim.** This is the highest-quality research
  available, and it is free.
- **Close on a next step, never on enthusiasm.** A date and an owner, or
  nothing. "This is really interesting" is not a step.

### The objection log

| Objection, verbatim | Times heard | What it really means | What changed since |
| --- | --- | --- | --- |
| | | | |

Three repeats of the same objection is not a sales problem. It is a message
problem or an offer problem, and it belongs back in `thesis-narrative` or
`thesis-offer`. Say which, and send them back. Handling the same objection
better forty times is not a strategy.

## What repeatable actually means

`sale-is-repeatable` is settled when the sequence is written down well enough
that **someone who is not the founder could follow it and get the same result.**

Until then, the founder is the product, and nothing about the business can be
delegated, priced or forecast. Test it by having someone else run one call.

## Organisation follows the constraint

Two questions, re-asked every quarter, and nothing else:

1. What is the one thing limiting growth this quarter?
2. Who owns it, by name, with real authority to change it?

Hire the bottleneck. Every other role can wait. Organisations designed around an
imagined future headcount generate coordination work instead of output, and the
coordination work then justifies more headcount.

## Watch for these

- **Pipeline as comfort.** A long list of interested parties with no dates.
  Count only next steps with an owner.
- **Discounting to close.** The first discount teaches the buyer that the price
  was never real, and it teaches the founder to avoid the silence.
- **Hiring salespeople before the sequence exists.** They will fail, it will
  look like their fault, and the real problem stays hidden.
- **Channel thrash.** Abandoning a channel at attempt four. Ten honest attempts
  in one channel beats one attempt in ten.

## Where this hands off

Once `sale-is-repeatable` is settled, you know what to build, for whom, and that
someone pays for it. That is the boundary of thesis-os.

Build-side methods take over from here: PRDs, architecture, epics and delivery.
Hand over the settled claims as the input, so that whatever gets built is
anchored to evidence rather than to a roadmap someone wrote before the
conversations happened.
