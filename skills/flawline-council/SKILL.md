---
name: flawline-council
description: Put a stage of the strategy to a panel that has not been told what the founder concluded, and report where the seats disagree with the page. Use when a stage document is written and about to harden, when a founder wants their thinking argued with before they commit to it, when claims have been sitting at the same confidence for a while and nobody has pushed on them, or when someone asks for a review, a critique, an FGD, a devil's advocate or a red team of their strategy. Run it on a stage that is already written — it audits claims rather than producing them.
---

# Council

Runs the panel behind `flawline council`. Read
[../DISCIPLINE.md](../DISCIPLINE.md) before anything else here.

This skill does not own a document and does not write to `strategy/`. It has
one job: take a pack, seat the panel honestly, and hand back a verdict the CLI
can read.

## What this is for, and what it cannot do

A stage document is written by one person who already believes it. Every other
check in flawline reads what is on the page. The council is the only one that
asks readers who were never told what the author concluded.

**A council cannot raise a confidence.** Not by agreeing, not unanimously, not
with a thousand seats. Nothing a panel says is an observation of the world, and
only observations move a `confidence:` line. If the founder reads a clean
council result as permission to write `validated`, this skill has done harm.

Say this once, plainly, before running: the best possible outcome here is
finding nothing, and finding nothing changes no line in any document.

## The one rule that makes it worth running

**Never tell a seat the confidence.** `flawline council <stage>` already strips
it from the pack; do not put it back, do not summarise it, do not let it appear
in the conversation a seat can see.

A reader shown `validated` grades a verdict. A reader shown the statement and
its evidence reaches one. Only the second is information, and the difference is
invisible in the output — which is why it has to be protected at the input.

The same goes for your own reading. If you have already formed a view of the
stage, do not put it in a seat's prompt.

## Running it

```bash
npx flawline council problem     # writes .flawline/council/problem.json
```

The pack carries the claims, their evidence and their dependencies, plus the
seats and the question each one owns. Convene the panel, then:

```bash
npx flawline council --ingest verdict.json
```

Findings come back as warnings. The command exits 0 whatever they say, because
a panel is not a build failure.

## The seats

Four judge, one synthesises. They are fixed for every stage, so a council run in
March and one run in June can be compared: a claim that survived the evidence
auditor and no longer does has changed.

Give each seat its own context. A single agent asked to play five roles produces
five paragraphs in one voice, converging on whatever it said first.

| Seat | Answers | Must refuse |
| --- | --- | --- |
| `evidence-auditor` | Is this an observation, or a conclusion the author reasoned their way to? | Judging whether the claim is *true*. Only whether anything outside the author's head is cited. |
| `method-challenger` | Given only the methods and counts, what is the strongest a careful reader could state this? | Guessing what the author wrote. The estimate is worthless once it is anchored. |
| `dependency-breaker` | If the claims underneath were wrong tomorrow, does this one survive on its own evidence? | Arguing the claims underneath *are* wrong. Assume they fall, and follow it. |
| `absent-party` | Who is described here but was never asked? | Inventing what that person would say. Name the gap; a filled gap becomes evidence. |
| `chairman` | Which seats found something the document does not already admit? | Adding an opinion. It counts; it does not decide. |

`method-challenger` is the sharpest of the four, because its answer is
falsifiable. It names a ceiling blind, and the CLI compares that to the line the
founder actually wrote. A gap there is the council's best finding: two readers
looking at the same sources, one of whom did not know the conclusion.

## The verdict

One object. `packId` comes from the pack unedited — it is how the CLI catches a
verdict answering wording that has since been rewritten.

```json
{
  "stage": "problem",
  "packId": "3f9a2c8e1b7d4a60",
  "seats": [
    {
      "seat": "evidence-auditor",
      "verdicts": [
        {
          "claim": "problem-exists",
          "position": "doubted",
          "note": "Cites research/acme.md, which is the author's own summary of a call. No transcript, no date, no second source."
        }
      ]
    },
    {
      "seat": "method-challenger",
      "verdicts": [
        { "claim": "problem-exists", "position": "holds", "supports": "indicated", "note": "Nine interviews. Real signal, nobody paid." }
      ]
    }
  ]
}
```

- `position` is `holds` or `doubted`. Two options, so a seat must commit.
  A seat that wants to say "it depends" is doubting.
- `supports` is `method-challenger` only, and is the blind ceiling.
- `note` points at the text. A note that does not quote or name something in the
  pack is an opinion, and the chairman drops it.

Half the judging seats must doubt a claim before the CLI reports it. One reader
in four disliking a sentence is the ordinary variance of asking four readers.

## Reading the result back to the founder

Lead with what it is: four readers who did not know what you concluded. Then the
findings, then the limit.

Do not translate dissent into an instruction to lower a line. `council-dissent`
means the claim is worth defending or worth re-evidencing — the founder may well
have the source the panel could not see, in which case the fix is to cite it,
not to downgrade.

`council-ceiling-dissent` is the one to slow down on. A reader who saw the
evidence and not the conclusion put it lower than you did. Either the evidence
block is missing something you know, or the line is. Ask which, and let the
founder answer.

Close on the asymmetry every time, because it is the part that gets forgotten:
a council can tell you a claim is thinner than it looks. It can never tell you
one is stronger. For that, someone still has to go and ask.
