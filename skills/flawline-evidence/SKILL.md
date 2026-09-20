---
name: flawline-evidence
description: Decide what to test, in what order, with pass and fail thresholds fixed before the test runs, and scope the smallest thing worth building. Use when planning validation or experiments, prioritising assumptions by risk, designing an MVP or prototype scope, deciding whether to build something in order to learn, or recording the result of a test that has finished. Also use when a founder is about to build for months on an untested premise.
---

# Evidence

Owns `strategy/evidence.md` and the claims `riskiest-assumption-named`,
`test-is-cheaper-than-building`, `pass-fail-set-in-advance`.

Read [../DISCIPLINE.md](../DISCIPLINE.md) before writing anything.

## Order tests by what they can kill

Two axes, and only two: how badly the thesis is damaged if the assumption fails,
and how cheap it is to find out.

| Assumption | Damage if wrong | Cost to test | Order |
| --- | --- | --- | --- |
| | | | |

Test the top-right first: high damage, low cost. Founders reliably default to
the bottom-left — cheap tests of things that cannot hurt them — because it feels
like progress and cannot produce bad news. Name the pattern when you see it.

Do not estimate the damage column by eye. `npx flawline what-if <claim>=refuted`
walks the dependency graph and names every claim that would be left resting on
a refuted premise, how many of them were `validated`, and which stages would
reopen. It changes nothing — it is the graph answering a question.

Run `npx flawline status` and read the `assumed` counts. The riskiest
assumption is usually a critical claim in an early stage that everything else
depends on. The dependency graph already knows; use it.

## The riskiest assumption is rarely technical

Engineers reach for the technical risk because it is the one they know how to
work on. Ask: if the technology worked perfectly tomorrow, what would still be
unproven? That answer is usually the real risk, and it is usually about whether
anyone will pay.

## One experiment, written before it runs

- **Assumption:** the claim id this tests
- **Method:** what you will actually do
- **Who:** how many, from where, how they were chosen
- **Runs until:** a date or a count, fixed now
- **Passes if:** the number that means yes
- **Fails if:** the number that means no
- **Then:** what you will do in each case

**"Fails if" is not optional.** A test without a failure threshold is not an
experiment, it is a way of collecting encouragement. If the founder resists
setting one, that resistance is itself information worth naming: they may not
want the answer.

Set both thresholds before the test runs. Decided afterwards, every result is a
pass, because humans are extremely good at finding the reading that suits them.

## Tests that do not require building

Work down this list before accepting that code is necessary:

- Ask for the money and see what happens. The shortest test in existence.
- Count who is already searching for it, and in what words. Cheapest test on
  the list, and the only one that runs without talking to anyone. Record it as
  `search-demand`. It can kill a premise and never confirm one.
- Sell the outcome and deliver it by hand for the first few customers.
- Take a deposit or a signed letter of intent.
- Put up a page describing the offer precisely and count who asks to buy.
- Do the job manually for one customer and time it honestly.
- Offer a competitor's product as a reseller and see whether the demand is real.

Only accept "we must build it" when the assumption genuinely cannot be tested
any other way. Say plainly when a founder is reaching for the keyboard to avoid
a conversation.

## The smallest thing worth building

Scope the build from the claims that survived, not the roadmap.

1. Which single claim still needs the product to exist to be tested?
2. What is the least you could build to test exactly that?
3. What will you deliberately do by hand, badly, and not automate yet?

Anything not serving question one is version two. Write it down somewhere else
so the founder can stop carrying it.

## Recording a result

When a test finishes, go back to the claim it tested and edit it:

- Passed at or above the bar: raise the confidence and add the `evidence` entry
  with the real count, method, source and date.
- Passed weakly: `indicated`, not `validated`. Honest and common.
- Failed: set it to `refuted`. Do not soften it, do not delete it, do not
  rewrite the statement into something that passed.

Then run `npx flawline check`. Refuting one claim is **supposed** to break the
claims above it, and the `rests-on-refuted` findings that appear are the point
of the whole tool. Walk the founder through each one and ask what it means. That
conversation is the value; the passing build is not.

## Handoff

Move to `flawline-narrative` once the offer survives its riskiest test. There is
no point writing a positioning statement for an offer that has not earned one.
