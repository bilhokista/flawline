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

  - id: moat-or-honest-absence
    statement: >-
      REPLACE ME. What gets harder for a competitor over time, or an honest
      admission that nothing does yet. Both are acceptable. Pretending is not.
    confidence: assumed
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
and add the evidence, or set it to \`refuted\`. Then run \`thesis-os check\`.
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
claims:
  - id: first-channel-proven
    statement: >-
      REPLACE ME. The one channel where you have reached a stranger and they
      engaged. One proven channel beats a plan with five.
    confidence: assumed
    critical: true
    depends_on: [channel-exists, positioning-is-contested]

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
  customer: CUSTOMER,
  offer: OFFER,
  model: MODEL,
  evidence: EVIDENCE,
  narrative: NARRATIVE,
  motion: MOTION,
};
