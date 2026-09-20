---
description: Knock out a claim, show what the graph says falls, then run a panel for the dependencies nobody declared and the personas who would notice.
argument-hint: <claim-id>
allowed-tools: Bash, Read, Write, Task
---

Knock out the claim `$1` and report the blast radius, both halves.

## 1. The half that is certain

```bash
npx flawline what-if $1 --deep
```

The output has two parts. The first is the dependency graph answering
deterministically: what falls, how much of it was `validated`, which stages
reopen. **Report that part as fact.** It is the same answer every run, and the
ordering in `evidence.md` is allowed to rest on it.

The second part is a handoff. Read the pack at `.flawline/whatif/$1.json`.

If the command exits non-zero, stop and report why.

## 2. The half that is a panel

The graph only knows the edges someone remembered to write. The expensive
dependency is usually the one nobody noticed. Two panels run here, and the
second one only sometimes.

### Edge seats — always

Spawn **one agent per seat** in `edgeSeats` — `premise-tracer`, `number-tracer`,
`retraction-tester` — in parallel, in one message.

Each gets its own `question` and `refuses` verbatim, the `target` claim, and the
`candidates` array. Nothing else — not the confidences (they are stripped), not
your view, not another seat's answer.

Each returns, for every candidate it believes depends on the target:

```json
{ "seat": "<id>", "edges": [ { "from": "<candidate id>", "note": "<quote the words that carry it>" } ] }
```

An edge needs **two of the three seats** before the tool reports it. Merge the
returns into one `edges` array with a `seats` list per edge; do not promote an
edge one seat found alone.

### Persona seats — only when the gate is open

Check `personas.available` in the pack.

**If false**, say so and skip this entirely. Print `personas.reason`. Do not
build personas anyway. A persona invented by a model is a confident voice with
nothing behind it, wearing a customer's costume — which is the exact failure
this project exists to prevent, with better production values.

**If true**, build one agent per persona from `personas.claims` — and only from
those. Every persona must trace to a `source` in that list: an interview
transcript, a search-intent cluster, whatever the customer stage actually cites.
Prefer one persona per distinct source over several shades of the same one.

Give each persona its source material and one question: *if this claim turned
out to be false, what changes for you?*

Each returns:

```json
{ "persona": "<short name>", "source": "<the source it came from>",
  "impact": "removes-need|changes-something|changes-nothing", "note": "<in their words>" }
```

A persona with no `source` is refused by the tool, and should be.

## 3. Ingest

Write `edges` and `personas` into one verdict file with `claim` and `packId`
carried from the pack unchanged, then:

```bash
npx flawline what-if --ingest verdict.json
```

## 4. Report

Keep the two halves apart in what you say. The graph result is reliable; the
panel result is a set of questions. Folding them together makes the reliable
half look as provisional as the panel half.

- `whatif-undeclared-edge` — the fix is a line in `depends_on`, not a rewrite.
  Until it is written, the graph cannot warn them this claim is at risk.
- `whatif-persona-indifferent` — every persona said losing it changes nothing.
  Ask which is true: the claim is about the wrong people, or it is not carrying
  the weight the document gives it.

Then the limit, every time: **nothing here raises a confidence.** No edge found,
no persona reaction, and no unanimous agreement is an observation of the world.
Only evidence moves a `confidence:` line, and someone still has to go and get it.
