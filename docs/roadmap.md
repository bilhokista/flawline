# What is being built next

Four changes, in order. The order is by cost: the cheapest one fixes the worst
minute, and each later one is easier once the earlier ones exist.

Written 2026-09-18, after a first full run of the problem, advantage and
customer stages against a real thesis.

## 1. An opening

**Problem.** `init` writes eight documents full of `REPLACE ME` and stops. A
first-time reader is told nothing about what this is, how long it takes, or what
is about to happen to them. The first real run of the problem stage opened with
three paragraphs of rules and a demand for a named week and a number, and the
reader stopped at the first question.

**Shape.** `init` says, briefly and once: what the eight documents are, that
`assumed` is the normal state of day one rather than a grade, that the stages
run in order and why, and what to do next. Short enough to read standing up.

**Done when.** A reader who has never seen this can say what it does and what it
will cost them, without opening a document.

## 2. `flawline report`

**Problem.** `status` shows counts and `check` shows findings. Neither says what
to do, and both leave the reader to work out what the state means.

**Shape.** A report of state, not of opinion. What is settled, what is assumed,
what the riskiest assumption is, and what the next action is — with the
recommendation **gated by the same rule that governs claims**:

| State | What may be recommended |
| --- | --- |
| problem `assumed` | talk to five people. Nothing else. |
| problem `indicated`, customer empty | find where they gather |
| customer `indicated` | the offer may now be discussed |
| offer `indicated` | channel and funnel may now be discussed |

The tool may tell you what to do. It may not tell you anything the evidence has
not bought, which is the same rule that stops a claim outrunning its support. A
report that recommends a funnel on top of eight assumptions is the slide this
project exists to prevent.

**Done when.** A thesis at day one produces exactly one recommendation — go and
talk to five people — and no amount of well-written documents changes it.

## 3. `--json`

**Problem.** The documents are markdown and YAML, so they are half machine
readable already, but nothing emits the computed state: confidences, gates,
findings, what the report concluded.

**Shape.** `report --json` and `check --json`. The same content, in a form
another agent can act on without parsing prose.

**Done when.** An agent can read the state, do the work that does not require
another human, and hand back.

## 4. The interview as the way in

**Problem.** Two doors contradict each other. `init` hands out blank forms;
the skills run an interrogation that refuses to inflate. A new reader hits the
forms first, fills them in, and gets a green `check` on eight guesses.

**Shape.** The documents become the transcript of a conversation rather than a
form to complete. This is the largest change and it should wait until 1-3 are
done, because they decide what "filled in" means.

**The boundary that does not move.** An agent can interview the founder, write
the documents, run the checks and act on the report. It cannot sit down with a
stranger, and it cannot make anyone pay. If every part is delegated, no claim
ever leaves `assumed`, and the output is a beautifully formatted account of
knowing nothing. One task stays human: facing people who are not you.
