# thesis-os

**Your strategy document cannot tell you which parts of it are guesses. This one can.**

A founder's thesis is a stack of claims. The problem is real, the segment is
reachable, they will switch, they will pay, this channel works. Each claim rests
on the ones below it, and in a normal strategy document — a deck, a Notion page,
a canvas — all of them are formatted identically. The claim backed by nine
interviews looks exactly like the one someone thought of in the shower.

So the stack gets built anyway, and the failure shows up months later as "we
built the wrong thing", when what actually happened is that a confident sentence
on slide fourteen was resting on an assumption nobody had written down.

thesis-os puts the strategy in git as markdown, makes every claim declare what
holds it up, and then refuses to let a claim be stronger than its own
foundations.

```console
$ npx thesis-os check
strategy/motion.md: error: [overreach] channel-works
    Claims "validated" while resting on "problem-exists", which is only
    "assumed". A claim cannot be stronger than what holds it up.
strategy/problem.md: error: [gate-not-met] problem-exists
    Critical problem claim is "assumed" but the gate requires "indicated", and
    work has already moved on to motion. Close this before going further.

2 error(s), 0 warning(s).
$ echo $?
1
```

That is a real run. The founder had campaign data for 200 prospects and a
conversion rate they were pleased with, sitting on top of a problem statement
nobody had ever checked with a customer. Both facts were in the same repository.
Nothing in a slide deck would have connected them.

## Install

```bash
npx thesis-os init
```

Seven documents appear in `strategy/`, one per stage, each pre-loaded with the
claims that stage owns — all marked `assumed`, because on day one that is what
they are.

```
strategy/
  problem.md     what goes badly, for whom, and what it costs
  customer.md    who they are, what they want done, who can say yes
  offer.md       what you sell, and whether the gain clears switching cost
  model.md       price, unit economics, channel, moat or honest absence
  evidence.md    what to test, in what order, with thresholds set in advance
  narrative.md   vision, mission, positioning, the story
  motion.md      go to market, selling, hiring the bottleneck
```

Edit the statements to say what you actually believe. Commit them. Then:

```bash
npx thesis-os status   # what is settled, what is still a guess
npx thesis-os check    # exits 1 when a claim outruns its evidence
```

## How a claim works

```yaml
---
stage: customer
gate:
  requires: indicated
  min_observations: 5
claims:
  - id: what-gets-in-the-way
    statement: >-
      Ops leads re-key invoice data between two systems every Monday because
      the finance export drops the cost centre.
    confidence: validated
    critical: true
    depends_on: [problem-exists]
    evidence:
      - method: interview
        source: research/interviews/2026-09-12-acme.md
        n: 9
        collected_at: 2026-09-12
---
```

Four fields do the work:

| Field | What it buys you |
| --- | --- |
| `confidence` | `assumed`, `indicated`, `validated` or `refuted`. The default is `assumed`, and admitting that costs nothing. |
| `evidence` | Where a stranger could go and check. No entry, no confidence above `assumed`. |
| `depends_on` | What this claim rests on. The checker walks it. |
| `critical` | The thesis does not survive without this one. Gates block on it. |

## What `check` actually enforces

| Finding | Meaning |
| --- | --- |
| `unsupported-confidence` | Marked `indicated` or better with no evidence cited. |
| `insufficient-observations` | Marked `validated` below the stage's bar. |
| `overreach` | Stronger than the claim holding it up. |
| `rests-on-refuted` | Built on something reality has already killed. |
| `gate-not-met` | A critical claim behind you is unsettled while you claim evidence ahead of it. |
| `unknown-dependency` | Depends on a claim that does not exist. |
| `dependency-cycle` | Two claims justifying each other. |
| `duplicate-claim-id` | The same id declared twice. |

Two design decisions are worth knowing about:

**Planning ahead is free.** Sketching all seven stages as assumptions passes
cleanly. Only claiming that reality has *confirmed* something moves the frontier
and starts gating what sits behind it. You are never punished for thinking
ahead, only for asserting ahead.

**Refuting a claim is supposed to break things.** When a test fails and you set
a claim to `refuted`, every claim above it starts erroring. That cascade is the
product. It is the list of things you believed for reasons that just stopped
being true, and no other tool in a founder's stack will hand it to you.

## Working with an AI agent

`skills/` holds one skill per stage, written for Claude Code, Cursor and any
agent that reads instruction files. They run the interviews, write the claims,
and — the part that matters — refuse to inflate a confidence because you sound
certain.

```bash
cp -r skills/thesis-* ~/.claude/skills/
```

Each skill is a standalone `SKILL.md`. Shared rules live in
[skills/DISCIPLINE.md](skills/DISCIPLINE.md), including the one that does the
most work:

> Never raise a confidence because the founder sounds certain. Certainty is not
> evidence. Conversations with friends, co-founders, investors and advisors are
> not customer evidence.

An agent with no instructions is an enthusiasm machine. It will help you write
a beautiful strategy document containing nothing you have checked. These skills
exist to make it argue with you instead.

## Where this stops

thesis-os ends at `sale-is-repeatable`: you know what to build, for whom, and
that a stranger has paid for it. Build-side methods take over from there —
requirements, architecture, delivery. There are good tools for that stage and
this is not one of them.

The gap this fills is the one before it. Plenty of tooling helps you build the
thing well. Almost none helps you find out whether the thing should exist, and
then hold you to what you found.

## Why markdown in git

Because strategy drifts from reality silently, and git is the only place that
makes drift visible.

- `git log strategy/problem.md` shows when you stopped believing something, and
  what you knew at the time.
- `thesis-os check` runs in CI, so a pull request that quietly upgrades a guess
  to a fact fails like any other broken build.
- It lives beside the code, so the people implementing a decision can read the
  evidence for it without asking anyone for access.

A canvas in a design tool cannot do any of that. It also cannot be wrong in a
way anyone notices.

## Prior art and licensing

This project stands on the Business Model Canvas, the Lean Canvas, and the jobs
to be done literature. Those debts, the licence each work carries, and what this
project deliberately does **not** reproduce are all set out in
[canvases/ATTRIBUTION.md](canvases/ATTRIBUTION.md).

The short version:

- **Code** (`packages/`) — MIT.
- **`canvases/`** — CC BY-SA 3.0, because it adapts work released under
  ShareAlike and those terms travel with it.

The split is real, not decorative: it means you can vendor the code without
inheriting a copyleft obligation, and it means the original authors' chosen
licence is honoured rather than quietly dropped.

## Contributing

`CONTRIBUTING.md` has the detail. Two things matter more than the rest:

1. **A new check needs a failing test first.** The whole value of this tool is
   that its findings are trustworthy. A false positive teaches founders to
   ignore the output, which is worse than having no tool.
2. **Methodology changes need a reason, not a preference.** Say what goes wrong
   for a real founder today, and what the change would have caught.

96 tests, 98% coverage. `npm test` at the repository root.
