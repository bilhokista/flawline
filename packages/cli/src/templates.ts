import type { Stage } from './model.js';

/**
 * Starter documents for each stage.
 *
 * Every template opens with claims set to `assumed`, because on day one that
 * is what they are. The templates ask questions rather than offering blanks to
 * fill, so that a founder who answers them honestly ends up with something a
 * stranger could argue with.
 */

const PROBLEM = `---
stage: problem
gate:
  requires: indicated
  min_observations: 5
claims:
  - id: problem-exists
    statement: >-
      REPLACE ME. Name one situation, for one kind of person, that goes badly
      today. No product, no solution, no adjectives.
    confidence: assumed
    critical: true

  - id: problem-is-expensive
    statement: >-
      REPLACE ME. Say what the situation costs them, in money, hours, risk or
      standing. A problem nobody pays for is a preference.
    confidence: assumed
    critical: true
    depends_on: [problem-exists]

  - id: they-already-try
    statement: >-
      REPLACE ME. Say what they do about it today: the spreadsheet, the intern,
      the competitor, the shrug. Existing behaviour is the only proof of demand
      that costs nothing to collect.
    confidence: assumed
    critical: true
    depends_on: [problem-exists]
---

# Problem

## Strip it to first principles

Answer in plain language. If a sentence would survive in a pitch deck
unchanged, it is probably too polished to be true yet.

1. **What happens, concretely?** Describe one occurrence. A named week, a named
   person, a named number. Not "teams struggle with reporting."
2. **Who is in the room when it hurts?** The person who feels it, the person who
   pays, and the person who can say no are often three different people. Name
   all three.
3. **How often, and what does each occurrence cost?** Frequency times cost is
   the whole size of the prize. Guess it, write the guess down, mark it assumed.
4. **What do they do today?** Every problem worth solving already has a bad
   solution in place. Find it. If there is none, ask whether the problem is real.
5. **Why has nobody fixed it?** There is always a reason. Regulation, habit,
   fragmentation, or the honest answer: it does not hurt enough.

## The question that kills most theses

> If this were solved perfectly tomorrow, whose budget does the money come out
> of, and what do they stop buying to pay for it?

If you cannot answer that, you do not have a problem yet. You have a topic.

## Before you move on

The gate on this stage asks for \`indicated\` on the critical claims. That means
you have talked to real people, not that you feel confident. Five conversations
is a floor, not a target.
`;

const ADVANTAGE = `---
stage: advantage
gate:
  requires: indicated
  min_observations: 3
  # Who you are does not expire. Whether the world still rewards this
  # particular oddity does, so recheck it about once a year.
  evidence_half_life_days: 365
claims:
  - id: what-is-authentically-mine
    statement: >-
      REPLACE ME. One trait, constraint, defect or piece of history that is
      genuinely yours and was not purchased. Not a skill you acquired because it
      was useful. The thing you would have anyway.
    confidence: assumed
    critical: true

  - id: context-values-it
    statement: >-
      REPLACE ME. The specific situation where that trait is an asset rather
      than a liability. Name the arena, not the aspiration.
    confidence: assumed
    critical: true
    depends_on: [what-is-authentically-mine, problem-exists]

  - id: expensive-to-fake
    statement: >-
      REPLACE ME. What it would cost a competitor to fake this credibly, in
      money, years or reputation. If the answer is a weekend, it is not an
      advantage.
    confidence: assumed
    critical: true
    depends_on: [what-is-authentically-mine]

  - id: combination-is-mine
    statement: >-
      REPLACE ME. Two unrelated things you hold together that others in this
      market do not. Optional, and often where the real answer hides.
    confidence: assumed
    depends_on: [what-is-authentically-mine]
---

# Advantage

This stage sits second, immediately after the problem, and that placement is
deliberate. An advantage discovered at the end is a justification written to
fit decisions already made. Discovered early, it decides which problem is
yours to solve, which segment will tolerate you, and which channel you can
sustain.

## Start from the defect, not the strength

The instinct is to list strengths. Resist it. Strengths are mostly purchased —
a skill you trained, a certificate you earned, a tool you bought — and anything
purchasable can be purchased by a competitor with more money than you.

So start at the other end. What is true of you that you would not have chosen?

- A constraint you cannot remove: where you live, what you can afford, how much
  time you actually have, who will not take your call.
- A trait that has cost you something: impatience, obsessiveness, an inability
  to let a wrong number go, discomfort in rooms where everyone agrees.
- A history that does not fit the role: the wrong degree, the failed venture,
  the unrelated decade, the thing you leave off the profile.
- A taste nobody asked for: the detail you cannot stop noticing, the standard
  you hold when nobody is watching.

Write these down plainly. Not reframed, not marketed. The reframing comes next
and it does not work on a sentence that has already been polished.

## Context decides whether a trait is a flaw

The mechanism is not that your defects are secretly virtues. It is that a trait
has no fixed value — the same characteristic is a liability in one setting and
an asset in another, so the work is choosing the setting.

Eric Barker calls these intensifiers in *Barking Up the Wrong Tree*, arguing
from the differential susceptibility research: traits that are normally
penalised become disproportionate advantages in the right environment. The
implication is uncomfortable and useful. The task is not to fix yourself. It is
to stop competing in the arena that charges you for being who you are.

So for each item above, ask:

1. **Where does this get punished?** Be specific. That is the arena to leave.
2. **Where would this be the exact thing required?** That is \`context-values-it\`.
3. **Who is in that arena already?** If nobody, ask why. If everybody, your
   trait is table stakes there rather than an edge.

An obsessive eye for detail is a liability in a business that competes on speed
and a requirement in one that competes on trust. Neither is a fact about the
trait.

## The forgery test

This is the claim that separates an advantage from a personality quirk, and it
is the one most founders skip because it is the one that can fail.

Ask literally: **what would it cost a competitor to fake this credibly?**

| Cost to fake | What you have |
| --- | --- |
| A weekend | Nothing. A preference. |
| A hire | A feature. They will copy it when you prove it works. |
| A year of doing it badly in public | A real advantage, for about a year. |
| Years of lived experience they did not have | An advantage that compounds. |
| They would have to become someone else | The only kind that lasts. |

The last two rows are only available for things that are authentically yours,
which is the whole reason this stage starts at defects rather than strengths. A
competitor can buy a skill, hire a specialist and license a technology. They
cannot buy having been the person who lived it, and they cannot fake the taste
that came from it without eventually being found out.

Note the second row carefully. Most things founders call an unfair advantage
are a feature with a hiring cost attached. That is not a reason to abandon it;
it is a reason to know how long you have.

## Two unrelated things, held together

Dave Trott's argument in *One Plus One Equals Three* is that new ideas are
recombinations, and that the useful connections come from material you were not
naturally drawn to. Most people gather more of what they already know, which
produces more of what already exists.

So \`combination-is-mine\` asks what two things you hold together that nobody
else in this market does. Not two skills — two worlds. The trade you learned
before this one, the community you belong to for unrelated reasons, the second
language, the craft that has nothing to do with the business.

A combination is harder to fake than either half, because a competitor would
have to want both, and almost nobody wants both.

## "Nothing yet" remains an honest answer

If no claim here survives the forgery test, write \`what-is-authentically-mine\`
as best you can and leave the rest \`assumed\`. That is an accurate description
of most businesses in their first year, and it is far better than a confident
sentence nobody believes.

What it tells you is specific and worth knowing: you are competing on execution
alone, in an arena where anyone with funding can follow you. That may be fine.
It should be a decision rather than a surprise.

## What counts as evidence here

This stage is the only one where you are a legitimate primary source, and the
limits are exact.

- \`method: self-report\` is capped at \`indicated\`. You know your own history.
  You are not a reliable judge of what it is worth, and the reason is that you
  have been rehearsing your own explanation for years.
- \`context-values-it\` needs outside evidence. Somebody chose you, paid you, or
  came to you **for this reason specifically**. Record it as
  \`won-for-this-reason\`.
- A deal lost because you lacked something is evidence too. Record it as
  \`lost-for-this-reason\`; it tells you where the trait is not an asset, and
  that boundary is more useful than another testimonial.
- \`expensive-to-fake\` is settled by what competitors actually did. Somebody
  tried to copy it and produced a worse version, or nobody tried at all despite
  obvious incentive. Record it as \`competitor-failed-to-copy\`.

Engagement, compliments and encouragement buy nothing here, exactly as
elsewhere. "People always tell me I'm good at this" is a self-report wearing a
borrowed coat.

## Where this goes next

Carry \`context-values-it\` into the customer and offer stages. The segment you
choose should be one that pays for your particular oddity rather than tolerating
it, and the offer should be the one only you would think to build.

Carry \`expensive-to-fake\` into the model stage, where
\`moat-or-honest-absence\` depends on it directly. A moat claim with no answer
here is a moat claim with nothing under it.
`;

const CUSTOMER = `---
stage: customer
gate:
  requires: indicated
  min_observations: 5
claims:
  - id: segment-is-reachable
    statement: >-
      REPLACE ME. Name the segment narrowly enough that you can list ten real
      names or one place they all gather. "SMBs" is not a segment.
    confidence: assumed
    critical: true
    depends_on: [problem-exists]

  - id: what-they-want-done
    statement: >-
      REPLACE ME. State what they are trying to accomplish, in their words, with
      no mention of your product. Progress they want, not features they lack.
    confidence: assumed
    critical: true
    depends_on: [problem-exists]

  - id: what-gets-in-the-way
    statement: >-
      REPLACE ME. The specific obstacle that stops them, ranked first among
      several. If everything is a blocker, you have not listened closely enough.
    confidence: assumed
    critical: true
    depends_on: [what-they-want-done]

  - id: what-good-looks-like
    statement: >-
      REPLACE ME. How they would know it went well. A number, a moment, or a
      sentence they would say to a colleague.
    confidence: assumed
    depends_on: [what-they-want-done]

  - id: who-can-say-yes
    statement: >-
      REPLACE ME. The role that can approve spending, and what that role is
      measured on. You sell to their scorecard, not to the problem.
    confidence: assumed
    critical: true
    depends_on: [segment-is-reachable]
---

# Customer

## Understanding before describing

A persona built from imagination is a mirror. A persona built from transcripts
is a tool. Do the conversations first, then write this section from quotes.

### Ask about the last time, never about the future

- "Walk me through the last time this came up." (Behaviour, not opinion.)
- "What did you do next?" (Reveals the existing bad solution.)
- "What did that cost you?" (Sizes the pain in their units.)
- "Who else got involved?" (Finds the real buyer.)
- "What have you already tried?" (Shows what you are replacing.)
- "What would have had to be true for you to fix it properly?" (Finds the gate.)

Never ask "would you use a tool that...". The answer is always yes and it is
always worthless.

## The persona, once you have earned it

Write it only from things you heard. Every line should be traceable to a
transcript you can cite in the \`evidence\` block of a claim.

| Field | Answer | Source |
| --- | --- | --- |
| Role and scorecard | | |
| Trigger that starts the search | | |
| What they do today instead | | |
| Words they use for the problem | | |
| Who must approve | | |
| What would make them say no | | |

## Interviews stop at "indicated", permanently

\`flawline check\` will not let an interview-backed claim reach \`validated\`,
however many interviews you run. This is not a quota you can grind past.

The reason is narrow and worth sitting with: nothing was at stake when the
answer was given. An interview can establish that a problem exists, what it
costs, who is involved and what they do today — genuinely the most valuable
research available at this stage. What it cannot establish is that anyone will
part with money, because being asked costs nothing and paying does not.

So the honest ceiling for this whole stage is \`indicated\`, and that is fine.
\`validated\` arrives later, in the offer and motion stages, and it arrives
carrying a receipt.

The same ceiling applies to surveys, waitlists, proposal requests and demos
that went well. Engagement — likes, saves, views, warm replies in DMs — buys
nothing at all, and the checker treats it that way.

## Before you move on

If you cannot name ten real people or one reliable channel where this segment
gathers, mark \`segment-is-reachable\` as \`assumed\` and stop. An unreachable
segment makes every later stage academic.
`;

const OFFER = `---
stage: offer
gate:
  requires: indicated
  min_observations: 5
claims:
  - id: offer-relieves-the-blocker
    statement: >-
      REPLACE ME. State how the offer removes the specific obstacle named in the
      customer stage. One obstacle, one mechanism.
    confidence: assumed
    critical: true
    depends_on: [what-gets-in-the-way]

  - id: offer-is-better-than-today
    statement: >-
      REPLACE ME. Say why this beats what they do today, on the dimension they
      actually care about. "Better UX" is not a dimension.
    confidence: assumed
    critical: true
    depends_on: [they-already-try, offer-relieves-the-blocker]

  - id: they-will-switch
    statement: >-
      REPLACE ME. Name the switching cost and why the gain clears it. Most
      offers die here, not at the value proposition.
    confidence: assumed
    critical: true
    depends_on: [offer-is-better-than-today]

  - id: what-we-sell
    statement: >-
      REPLACE ME. The unit of sale, in one sentence a buyer would repeat. A
      seat, an outcome, a retainer, a transaction fee.
    confidence: assumed
    critical: true
    depends_on: [who-can-say-yes]
---

# Offer

## Fit is a claim, not a diagram

Fit means one thing: for each obstacle the customer actually named, the offer
does something specific about it, and that something beats their current
workaround by enough to justify the switch.

Write it as a table and be ruthless about the third column.

| What gets in their way | What the offer does about it | Better than today because |
| --- | --- | --- |
| | | |

Rules for the table:

- Only rows where the left column came from a transcript. No invented obstacles.
- A row with a weak third column is not a feature, it is a distraction. Cut it.
- If the table has eight rows, you are describing a platform to people who asked
  for a fix. Pick the one row that would make them switch on its own.

## What you sell, exactly

Three questions that decide the shape of the business:

1. **What is the unit?** What increments when they pay you more?
2. **When does value arrive relative to payment?** Before, and you have a trust
   problem. Long after, and you have a churn problem.
3. **What is the smallest thing you could charge for that still relieves the
   blocker?** That is your wedge. The rest is roadmap.

## Anti-pattern: the offer that fits a problem nobody ranked first

An offer can fit perfectly and still fail, because the problem it fits sits
ninth on the buyer's list. Check the rank, not just the fit.

## Before you move on

\`they-will-switch\` is the claim most founders skip and most businesses die of.
Do not mark it \`indicated\` on enthusiasm. Mark it when someone changed their
behaviour: a deposit, a pilot, a calendar invite they kept.
`;

const MODEL = `---
stage: model
gate:
  requires: indicated
  min_observations: 3
  # Channel and cost facts rot. A conversion rate from six months ago
  # describes a platform that has since changed its algorithm, or a referral
  # pool that has since run dry. Re-measure or downgrade.
  evidence_half_life_days: 120
claims:
  - id: price-clears-value
    statement: >-
      REPLACE ME. The price, and the value it is a fraction of. Price against
      what the problem costs them, never against your effort.
    confidence: assumed
    critical: true
    depends_on: [problem-is-expensive, what-we-sell]

  - id: unit-economics-work
    statement: >-
      REPLACE ME. What it costs to serve one customer and to acquire one. If
      acquisition cost is unknown, say so and mark this assumed.
    confidence: assumed
    critical: true
    depends_on: [price-clears-value]

  - id: channel-exists
    statement: >-
      REPLACE ME. One channel that reaches the segment at a cost the price can
      carry. One that works beats five that might.
    confidence: assumed
    critical: true
    depends_on: [segment-is-reachable]

  - id: reach-is-owned-or-decay-is-planned
    statement: >-
      REPLACE ME. Say whether the channel's reach is owned or borrowed, and if
      borrowed, what you will do when it stops. Marketplace placement, platform
      algorithms and word of mouth are borrowed. They end without notice.
    confidence: assumed
    critical: true
    depends_on: [channel-exists]

  - id: moat-or-honest-absence
    statement: >-
      REPLACE ME. What gets harder for a competitor over time, or an honest
      admission that nothing does yet. Both are acceptable. Pretending is not.
    confidence: assumed
    depends_on: [expensive-to-fake]
---

# Model

## The one-page summary

Fill it in after the problem, customer and offer stages, never before. A model
written first is a wish list with a grid around it.

The worksheet lives in [canvases/one-page-model.md](../canvases/one-page-model.md).
It sits in its own directory under a different licence, because it adapts work
that was released under ShareAlike terms and those terms travel with it. The
reasons are set out in [canvases/ATTRIBUTION.md](../canvases/ATTRIBUTION.md),
which is worth reading before you reproduce or rename anything from it.

Copy the confidence of each claim into the worksheet rather than judging each
box afresh. A summary that upgrades a guess into a fact is worse than no
summary.

## Monetisation, decided rather than defaulted

Pick deliberately; each choice buys a different business.

| Shape | Buys you | Costs you |
| --- | --- | --- |
| One-off fee | Cash now, simple sale | No compounding, constant hunting |
| Subscription | Compounding revenue | Churn becomes your real product |
| Usage based | Aligns with value | Revenue you cannot forecast |
| Take rate | Scales with their success | You need their volume first |
| Retainer | Predictable, high trust | Capped by your own hours |

Then answer the three that actually set the number:

1. What does the problem cost them per year? Your price is a fraction of that.
2. What is the next best alternative, priced? You are compared to it whether you
   like it or not.
3. What is the cheapest way they can say yes? That is the top of your ladder,
   not the whole ladder.

## Owned reach and borrowed reach

This is the distinction that decides whether your channel is an asset or a
loan, and it is the one most founders never make explicitly.

| Borrowed | Owned |
| --- | --- |
| Marketplace placement and in-platform search | Your list, your customers' inboxes |
| Organic reach from a social algorithm | A direct relationship you can contact |
| Word of mouth and referral | A partnership with terms in writing |
| Anything a platform can switch off | Anything you would keep if a platform died |

Borrowed reach is not bad. It is often the only affordable way to start, and
turning it down on principle is its own mistake. The error is treating it as
permanent.

Two properties make it dangerous:

1. **It ends without notice.** Nobody sends a message when the algorithm
   changes or the referral pool empties. Revenue simply stops, and by the time
   the trend is obvious you have built several months of plans on top of it.
2. **The decline looks like your fault.** Founders respond by working harder in
   a channel that has already closed, because the alternative explanation is
   uncomfortable.

So \`reach-is-owned-or-decay-is-planned\` asks for two things: which kind it is,
and — if borrowed — what you are converting it into while it still works. A
borrowed channel with no conversion plan is a countdown nobody is watching.

## Evidence in this stage expires

The gate sets \`evidence_half_life_days: 120\`. A \`validated\` claim here goes
stale after four months and \`flawline check\` will say so.

That is not pedantry. A conversion rate, an acquisition cost and a channel
that works are all claims about a world that changes underneath you. Put a
\`collected_at\` date on every evidence entry in this stage so the tool can tell
you when a fact has quietly become a memory.

## The check that matters

\`unit-economics-work\` depending on \`price-clears-value\` is not bureaucracy.
A margin calculated from a price nobody has paid is arithmetic about fiction.
`;

const EVIDENCE = `---
stage: evidence
gate:
  requires: indicated
  min_observations: 1
claims:
  - id: riskiest-assumption-named
    statement: >-
      REPLACE ME. The one assumption that, if wrong, makes everything else
      pointless. Usually not the technical one.
    confidence: assumed
    critical: true
    depends_on: [they-will-switch]

  - id: test-is-cheaper-than-building
    statement: >-
      REPLACE ME. How you will test that assumption without building the
      product. If the only test is to build it, you have not thought yet.
    confidence: assumed
    critical: true
    depends_on: [riskiest-assumption-named]

  - id: pass-fail-set-in-advance
    statement: >-
      REPLACE ME. The number that means yes and the number that means no,
      written before the test runs. Decided after, every result is a pass.
    confidence: assumed
    critical: true
    depends_on: [test-is-cheaper-than-building]
---

# Evidence

## Order the tests by what they can kill

Rank every assumption on two axes: how badly you are wrong if it fails, and how
cheap it is to find out. Test the top-right first. Founders default to the
cheap-and-harmless corner because it feels like progress.

| Assumption | Damage if wrong | Cost to test | Order |
| --- | --- | --- | --- |
| | | | |

## One experiment, written before it runs

Copy this block per experiment. The last two lines are the whole point.

- **Assumption:** the claim id this tests
- **Method:** what you will actually do
- **Who:** how many, from where, and how they were chosen
- **Runs until:** a date or a count, fixed now
- **Passes if:** the number that means yes
- **Fails if:** the number that means no
- **Then:** what you will do in each case

If "fails if" is empty, you are not running an experiment. You are collecting
encouragement.

## The smallest thing worth building

Scope the first build from the claims that survived, not from the roadmap.

1. Which single claim still needs the product to exist in order to be tested?
2. What is the least you could build to test exactly that?
3. What will you deliberately do by hand, badly, and not automate yet?

Anything that does not serve question one is version two.

## Recording results

When a test finishes, go back and edit the claim it tested: raise the confidence
and add the evidence, or set it to \`refuted\`. Then run \`flawline check\`.
Refuting one claim is supposed to break the claims above it. That breakage is
the tool working.
`;

const NARRATIVE = `---
stage: narrative
gate:
  requires: indicated
  min_observations: 1
claims:
  - id: why-this-exists
    statement: >-
      REPLACE ME. The change in the world this exists to cause, stated without
      naming your product. If it would fit any company, it is not yours.
    confidence: assumed
    critical: true
    depends_on: [problem-exists]

  - id: positioning-is-contested
    statement: >-
      REPLACE ME. What you are, for whom, instead of what. A position with no
      "instead of" is a description, and nobody switches for a description.
    confidence: assumed
    critical: true
    depends_on: [offer-is-better-than-today]

  - id: story-is-theirs-not-yours
    statement: >-
      REPLACE ME. The one-sentence version where the customer is the one who
      changes. Your founding journey is not the story.
    confidence: assumed
    depends_on: [what-they-want-done]
---

# Narrative

## Vision and mission, kept apart

- **Vision** is the world once you have won. No product in it. Test: would you
  still want it if a competitor caused it?
- **Mission** is your assignment inside that world. Product allowed. Test: could
  someone tell whether you did it today?

Most drafts fail because the vision contains the product and the mission
contains an adjective. Cut both.

## Positioning, in a form that can be wrong

> For **[segment]** who **[trigger]**, **[name]** is the **[category]** that
> **[the one thing]**, instead of **[the alternative they use today]**.

Every bracket must be traceable to an earlier stage. If \`[the alternative]\` is
empty, go back to \`they-already-try\`. A position without an opponent has
nothing to displace.

## The story that does the work

Four moves, in order. The customer is the subject of all four.

1. **The world as they live it.** Recognition. They should feel seen, not sold.
2. **What quietly costs them.** Specific and small, not sweeping.
3. **What becomes possible.** The change, in their terms.
4. **What to do next.** One action, unmistakable.

Your product appears in move three, briefly. If it appears in move one, you have
written a brochure.

## Brand as consequence, not decoration

Voice, look and name are downstream of the position. Decide the position first;
the brand then has something to be consistent with. Reversing the order is how
companies end up with beautiful assets that say nothing.

## Before you move on

Narrative claims are easy to mark \`validated\` because they feel true. They are
\`indicated\` only when someone repeated your position back to you accurately
without prompting. That is the test: can they retell it?
`;

const MOTION = `---
stage: motion
gate:
  requires: indicated
  min_observations: 3
  # A channel that worked is not a channel that works. Re-measure quarterly.
  evidence_half_life_days: 120
claims:
  - id: first-channel-proven
    statement: >-
      REPLACE ME. The one channel where a stranger arrived and bought. The
      strongest form of this is someone approaching you unprompted, because
      nothing you pushed can explain it away.
    confidence: assumed
    critical: true
    depends_on: [reach-is-owned-or-decay-is-planned, positioning-is-contested]

  - id: someone-unrelated-paid
    statement: >-
      REPLACE ME. A sale to someone you did not already know. The first honest
      revenue. Friends and network do not count here.
    confidence: assumed
    critical: true
    depends_on: [price-clears-value, first-channel-proven]

  - id: sale-is-repeatable
    statement: >-
      REPLACE ME. The sequence that closed it, written down well enough that
      someone else could follow it and get the same result.
    confidence: assumed
    critical: true
    depends_on: [someone-unrelated-paid]

  - id: org-matches-the-bottleneck
    statement: >-
      REPLACE ME. The single constraint on growth right now, and who owns it.
      Hire the bottleneck, not the org chart.
    confidence: assumed
    depends_on: [sale-is-repeatable]
---

# Motion

## Go to market is a sequence, not a launch

1. **Reach one stranger.** Not the network. A stranger is the only honest test
   of the position.
2. **Repeat it by hand.** Same channel, same pitch, ten times. Founder-led and
   unautomated on purpose.
3. **Write down what worked.** The exact words, objections and order.
4. **Only then spend money.** Paid acquisition multiplies a working motion and
   accelerates a broken one.

Skipping to step four is the most expensive mistake available to you.

## The strongest proof a channel is real

Ranked by how hard each one is to explain away:

1. **Someone arrived unprompted and bought.** Nothing you pushed can account
   for it. Record it as \`method: inbound-unprompted\`.
2. **Acquisition cost held steady across two separate periods.** One good month
   is variance; two is a pattern. One month is the number founders quote.
3. **A second purchase from the same customer.** Proves the value landed, not
   only that the pitch did.
4. **A first payment from a stranger.** The floor. Necessary, and routinely
   mistaken for the ceiling.

Anything below that line — enthusiasm, saved posts, a proposal request, a
meeting that went well — is not channel evidence. \`flawline check\` enforces
this through method ceilings, so recording it honestly costs you nothing.

Also note which channel this was, and whether its reach was owned or borrowed.
A borrowed channel that is working right now is on a clock you cannot see; the
work of converting it into owned reach has to happen while the numbers are
still good, because afterwards there is nothing left to convert.

## Selling, for people who do not think of themselves as salespeople

The job is diagnosis, not persuasion. You already did the research; the call is
where you check whether this particular person has the problem.

- **Open with their situation, not your product.** "You mentioned X happens every
  month. Still true?"
- **Let them say no early.** A fast no is a gift. A slow maybe is the expensive
  outcome.
- **Quantify with them, not at them.** Ask what it costs; do not tell them.
- **Name the price plainly and stop talking.** Discomfort is not an objection.
- **Write the objection down verbatim.** Objections are the highest-quality
  research you will ever get for free.
- **Close on a next step, never on enthusiasm.** A date and an owner, or nothing.

### The objection log

| Objection, verbatim | Times heard | What it really means | What changed since |
| --- | --- | --- | --- |
| | | | |

Three repeats of the same objection is not a sales problem. It is a message
problem or an offer problem, and it belongs back in an earlier stage.

## Organisation follows the constraint

Ask only two questions, and re-ask them every quarter:

1. What is the one thing limiting growth this quarter?
2. Who owns it, by name, with the authority to change it?

Every other role can wait. Organisations designed from an imagined future
headcount produce coordination work instead of output.

## Where this hands off

Once \`sale-is-repeatable\` is settled, you know what to build and for whom.
That is the boundary of this tool. Build-side methods take over from here.
`;

export const STAGE_TEMPLATES: Readonly<Record<Stage, string>> = {
  problem: PROBLEM,
  advantage: ADVANTAGE,
  customer: CUSTOMER,
  offer: OFFER,
  model: MODEL,
  evidence: EVIDENCE,
  narrative: NARRATIVE,
  motion: MOTION,
};
