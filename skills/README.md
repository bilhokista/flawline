# Skills

One skill per stage, for Claude Code, Cursor, and any agent that reads
instruction files.

## Install

In Claude Code, add the marketplace and install the skills as a plugin:

```
/plugin marketplace add bilhokista/flawline
/plugin install flawline@flawline
```

To copy the skills in by hand instead, or to use them outside Claude Code:

```bash
git clone https://github.com/bilhokista/flawline.git
cp -r flawline/skills/flawline-* ~/.claude/skills/
```

Each directory is a standalone `SKILL.md` with frontmatter, so it also works by
pointing any other agent at the file directly.

## The skills

| Skill | Owns | Invoke it when |
| --- | --- | --- |
| `flawline-problem` | `problem-exists`, `problem-is-expensive`, `they-already-try` | Someone brings an idea. Always first. |
| `flawline-advantage` | `what-is-authentically-mine`, `context-values-it`, `expensive-to-fake`, `combination-is-mine` | Moat, differentiation, or "why this founder". Runs second. |
| `flawline-customer` | `segment-is-reachable`, `what-they-want-done`, `what-gets-in-the-way`, `what-good-looks-like`, `who-can-say-yes` | Defining who it is for, or turning transcripts into claims. |
| `flawline-offer` | `offer-relieves-the-blocker`, `offer-is-better-than-today`, `they-will-switch`, `what-we-sell` | Deciding what to sell, or cutting a feature list to a wedge. |
| `flawline-model` | `price-clears-value`, `unit-economics-work`, `channel-exists`, `moat-or-honest-absence` | Pricing, revenue shape, unit economics. |
| `flawline-evidence` | `riskiest-assumption-named`, `test-is-cheaper-than-building`, `pass-fail-set-in-advance` | Planning validation, scoping an MVP, recording a result. |
| `flawline-narrative` | `why-this-exists`, `positioning-is-contested`, `story-is-theirs-not-yours` | Positioning, vision, mission, brand story. |
| `flawline-motion` | `first-channel-proven`, `someone-unrelated-paid`, `sale-is-repeatable`, `org-matches-the-bottleneck` | Go to market, selling, hiring the bottleneck. |

Two slash commands run the panels end to end, spawning one agent per seat and
ingesting the result: `/flawline-council <stage>` and `/flawline-what-if <claim>`.

One more skill sits outside the order:

| Skill | Owns | Invoke it when |
| --- | --- | --- |
| `flawline-council` | nothing | A stage is written and about to harden, and wants arguing with. Audits claims; never produces them. |

They are ordered because the claims depend on each other. A skill invoked out of
order will still run, and will leave its upstream claims marked `assumed` — so
`flawline check` keeps telling the truth about what was skipped.

## Read this first

[DISCIPLINE.md](DISCIPLINE.md) holds the rules every skill obeys. The
load-bearing one:

> Never raise a confidence because the founder sounds certain. Certainty is not
> evidence.

An agent with no instructions is an enthusiasm machine. Ask it about your
business idea and it will help you produce a strategy document that reads
beautifully and contains nothing you have checked. These skills are written to
make it push back instead, which is the only thing about them that is actually
worth having.

## Writing your own stage

If you fork a stage skill, keep three things:

1. **The claim ids.** Other stages depend on them by name. Renaming one silently
   breaks the graph.
2. **The confidence rules.** A skill that raises confidence generously makes the
   checker lie, and a checker that lies is worse than no checker.
3. **The finishing step.** Run `npx flawline check`, then tell the founder the
   one thing that most needs evidence next.
