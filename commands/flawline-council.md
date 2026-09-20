---
description: Convene the five-seat council on one strategy stage — spawns a separate agent per seat, collects the verdict, and ingests it.
argument-hint: <stage>
allowed-tools: Bash, Read, Write, Task
---

Convene the council on the stage `$1`.

Read `skills/flawline-council/SKILL.md` (or the installed `flawline-council`
skill) before starting. The rules there govern this command; what follows is the
orchestration only.

## 1. Build the pack

```bash
npx flawline council $1
```

If that fails, stop and report why. Do not invent a pack.

Read the written pack at `.flawline/council/$1.json`. It contains the claims
with `confidence:` already stripped, and the seats with the question each one
owns.

## 2. Seat the panel

Spawn **one agent per judging seat** — `evidence-auditor`, `method-challenger`,
`dependency-breaker`, `absent-party` — using the Task tool, in parallel, in a
single message.

Each agent gets:

- Only its own seat's `question` and `refuses`, verbatim from the pack.
- The claims array, verbatim.
- Nothing else. **Do not** tell a seat what the founder concluded, what you
  think of the stage, what another seat said, or what you expect to find. A seat
  that has been anchored produces an answer that looks identical to an honest
  one and is worth nothing.

Require each agent to return JSON only:

```json
{ "seat": "<its seat id>",
  "verdicts": [ { "claim": "<id>", "position": "holds|doubted", "note": "<points at the text>" } ] }
```

`method-challenger` additionally returns `"supports": "assumed|indicated|validated"`
on each verdict — its blind estimate of the strongest a careful reader could
state that claim, given only the methods and counts. It has not been shown the
written confidence and must not guess at it.

A seat that returns prose instead of JSON gets one retry with the format
repeated. If it fails twice, record that seat as absent rather than writing its
verdict yourself.

## 3. Chair it

Read the four returns. As chairman, drop any verdict whose `note` does not point
at something in the pack — an assertion with no anchor is an opinion, and the
chairman's only job is to keep those out. Do not soften, merge or add to what
the seats said.

Write the surviving returns to `verdict.json`, carrying `packId` from the pack
unchanged.

## 4. Ingest

```bash
npx flawline council --ingest verdict.json
```

## 5. Report

Give the founder, in a few sentences:

- What this was: four readers who were not told what they concluded.
- The findings, if any, in the tool's own words.
- For `council-ceiling-dissent`, the question it raises: either the evidence
  block is missing something they know, or the line is.

Close on the limit, every time. **A council can tell you a claim is thinner than
it looks. It can never tell you one is stronger.** Nothing here raises a
`confidence:`, and nothing here is an `evidence:` entry. If the panel found
nothing, say that plainly — and say that finding nothing also changes no line.
