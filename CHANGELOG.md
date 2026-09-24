# Changelog

## Unreleased

### Added

- **`flawline xray <file>`, and `/flawline-xray` in the plugin.** Point it at the
  page you already have: a landing page, a deck, a README. It reports every
  claim the page makes, which of them point anywhere, and which carry a number
  nobody showed. Nobody arrives with an empty `strategy/` folder, and asking
  them to start over from a blank template was the most expensive first minute
  the tool had.

  A model does the reading, because finding assertions in prose is reading.
  The tool refuses anything it cannot check for itself. Every quote has to
  appear in the source word for word, so a paraphrased or invented claim is
  rejected and named. A citation counts only when the page carries it. Numbers
  are spotted by looking, including the ones written out in words: "nine
  interviews" reads as measured exactly as much as "9" does.

  It never writes to `strategy/`. What an x-ray finds is what the page
  believes, and all of it starts as `assumed`.

## 0.10.0

### Added

- **`search-demand` and `forum-question`, at `indicated`.** Aggregate search
  volume for a need, and questions people posted in public wanting an answer.
  Both were previously filed under `scraping` and bought nothing, which was
  wrong about the axis that matters: nobody was answering a researcher. A query
  is typed by someone who wanted the thing at that moment, and a public
  question is asked by someone who wanted a way out and said so in their own
  words. Neither was prompted, both leave an artefact a stranger can reopen,
  and neither is an opinion about behaviour — they are behaviour.

  Both stop at `indicated` because nothing was at stake. Both are confined to
  the `problem` and `customer` stages, and neither reaches
  `problem-is-expensive`: people search and post when they are annoyed and when
  they are bleeding money, and it reads the same either way.

  Record `search-demand` with the query, the tool and the date range, so a
  stranger can run it again. Record `forum-question` one entry per thread, with
  its URL and date. Count threads, never replies — a post with two hundred
  comments is one person with one problem and an audience.

- **`official-statistics`, at `assumed`.** A census, a national survey, an
  official register. The ceiling is not a judgement on the source: it is the
  best-measured thing in the table, and it measures the wrong thing.
  Statistics count populations, every claim here is about how people behave
  toward a problem, and the sentence that walks from one to the other is the
  oldest slide in the deck.

  Recorded anyway, for the reason `bot-outreach` is — someone will cite it, so
  it should have a name that tells the truth about what it buys. It keeps the
  power that matters: a ceiling caps support, a refutation is not support, so a
  statistic showing the population is a fortieth of the assumption still kills
  the claim outright.

- **`flawline council <stage>`.** A pack of claims with the `confidence:` lines
  stripped, for four judging seats and a chairman. The stripping is the whole
  mechanism: a reader shown "validated" grades a verdict, a reader shown the
  statement and its evidence reaches one, and the two are indistinguishable in
  the output, so it has to be protected at the input.

  Seats are fixed for every stage rather than generated, so runs can be
  compared — a claim that survived the evidence auditor in March and does not
  in June has changed. `method-challenger` is the sharpest, because its answer
  is falsifiable: it names a ceiling blind, and the tool compares that to the
  line actually written.

  Verdicts come back through `council --ingest` as warnings, exit 0. A council
  can lower a claim and never raise one. Nobody on a panel went anywhere, asked
  anyone or paid for anything, so a unanimous council changes no `confidence:`
  and never appears in an `evidence:` block.

  The model lives outside the checker. The pack goes out as JSON and the
  verdict comes back as JSON, so `check` stays offline, single-dependency and
  reproducible in CI, and the panel can be five models, five subagents or five
  people in a room.

- **`flawline what-if <claim>=refuted`.** `depends_on` has been in the
  documents since the beginning and nothing ever asked it anything. This copies
  the thesis with one confidence changed, runs the ordinary checker over the
  copy, and reports what newly breaks — no clock, no network, no model, and
  deliberately no new rules.

  Findings already present are subtracted, so a thesis with existing problems
  does not report all of them as consequences of the knock-out. It exits 0 and
  writes nothing: a counterfactual is not a failure.

- **`flawline what-if <claim> --deep`.** The graph is exactly as good as the
  edges someone remembered to write, and the dependency that costs six months
  is the one nobody noticed. Three seats scan every other claim for an
  undeclared edge, and two must agree before it is reported.

  Personas say what losing the claim changes for them, and only when the
  customer stage carries real signal with sources; any persona citing none is
  refused. A persona invented by a model is a confident voice with nothing
  behind it in a customer's costume. The persona half may report one thing —
  that nobody the claim is about would notice losing it. Agreement is silence.

- **`creates_market: true`, with `precautions`.** Every method here reads
  demand that already exists, and a founder creating a category has none of it.
  The flag is not an exemption; it is a more expensive obligation. A claim
  carrying it must declare `turn_back`, `cost_ceiling`, and what it learns
  either way, or it is refused.

  While the turn-back date is ahead, the claim passes its gate and the stages
  after it open, with a warning on every run. On the date that stops by itself:
  the claim becomes an error and the stages close again. The date is mechanical
  rather than a reminder, because the person far enough in to be certain the
  market is nearly there is the last one who should get a vote on whether to
  keep going.

  It buys ordering and never strength — a downstream claim still cannot be
  stated more strongly than the bet underneath it. A claim declaring the flag
  while citing `search-demand`, `forum-question` or reviews is told so: the
  market was already there.

- **`/flawline-council` and `/flawline-what-if`.** Slash commands that run both
  panels end to end — one agent per seat, each given only its own question and
  refusal, none told what the founder concluded.

- **`flawline-council` skill**, and a section in `DISCIPLINE.md` for the rule
  that governs all of the above: an argument is not an observation.

### Changed

- **`Claim` gained a required `createsMarket` field**, and an optional
  `precautions`. Code that builds a `Claim` value directly against the exported
  types must set it. Documents are unaffected: `creates_market` defaults to
  false when absent.

- **New finding codes**, all of them warnings written by the panels rather than
  by `check`: `council-dissent`, `council-ceiling-dissent`, `council-pack-stale`,
  `council-unknown-claim`, `whatif-undeclared-edge`,
  `whatif-persona-indifferent`, `whatif-pack-stale`, `whatif-unknown-claim`.
  `check` itself gained `precautions-missing`, `turn-back-passed`,
  `proceeding-without-evidence` and `market-already-exists`.

### Fixed

- **A positional argument after any command was silently ignored.** `flawline
  check twice` checked everything while appearing to narrow. Only `council` and
  `what-if` take a positional now; everything else reports it.

## 0.9.0

### Added

- **`shipped-workaround`, at `indicated`.** Code somebody else shipped whose
  purpose is to prevent this failure: a guard, an override, a manual procedure
  documented in a product's own README. The mitigation itself, in a repository
  a stranger can open — not a post about the risk.

  It reaches `they-already-try`, which `incident-record` cannot, and the reason
  the older limit does not apply is worth stating. That limit exists because
  what someone does about a problem lives in their head. Once they have shipped
  the workaround, it does not: it is in their repository, as code, with a commit
  date. Engineering effort spent avoiding something is evidence they were
  avoiding it.

  It stops at `indicated` because effort is not cost — a team can guard against
  a risk that never once cost anybody anything — and it cannot raise
  `problem-is-expensive`, reported as `method-beyond-reach`.

  Like `verified-review`, it counts on the `problem` and `customer` stages
  only. Both now share `OTHERS_BEHAVIOUR_METHODS`, because both describe what
  other people already do, and past those stages the claims are about your own
  offer.

## 0.8.0

### Added

- **`verified-review`, at `indicated`.** A review left by someone the platform
  confirms paid. Two facts arrive together: a stranger described the problem
  unprompted, and they had already spent money trying to solve it. Better than
  an interview where interviews are weakest — nobody was being polite to a
  researcher — and worse on specificity, because there is no follow-up
  question.

  It counts on the `problem` and `customer` stages, where the claims are about
  what people already do. Past that the claims are about your offer, and a
  review of a competitor is a fact about them.

  It may raise `they-already-try`, which an incident record cannot: a purchase
  *is* them already trying. It may not raise `problem-is-expensive`, reported
  as the new `method-beyond-reach` finding. People write reviews about being
  annoyed, not about the money.

- **`bot-outreach`, at `assumed`.** Outreach an agent sent without telling the
  recipient. A reply measures what a stranger says to a fiction, which is the
  `friend` problem in different clothes. The checker cannot tell who pressed
  send, so this exists to give an honest author a truthful label rather than to
  catch a dishonest one.

### Changed

- The per-method claim limits are now declared in one place,
  `METHOD_CLAIM_LIMITS`, instead of living inside the checker. Each entry
  should be defensible in one sentence; one that is not should be deleted
  rather than kept for safety. `OCCURRENCE_ONLY_CLAIM_IDS` is derived from it
  and still exported.

## 0.7.0

Documents written by hand under 0.6.0 will need one new section each. The
templates ship it, so `flawline init` is unaffected.

### Added

- **`no-refutation-recorded`: a document carrying a critical claim must say how
  it could be wrong.** This is the only rule that reads prose, and it reads it
  for one structural fact — is there a `## What would refute this` section, and
  does it say anything. It does not grade writing. A checker with opinions
  about sentences becomes a style argument and stops being about evidence.

  It exists because one failure survived every other rule: confidences recorded
  honestly as `assumed`, and prose underneath them arguing the idea will work.
  Naming what would refute a claim is the opposite motion to selling it, so a
  document that cannot manage a line of it is a pitch wearing a thesis's
  clothes.

  `How this could be wrong` is accepted as the other spelling. Heading depth and
  case are ignored; an empty section is not.

- **Every stage template now ships its refutation section**, pre-filled with
  what would kill that stage's own claims.

### Changed

- `parseThesis` returns the prose of each document alongside the claims, as
  `Thesis.prose`. It is optional, so a caller assembling claims by hand is not
  forced to invent prose it does not have, and the rule stays quiet when it is
  absent.

## 0.6.0

Documents written ahead of their evidence now fail. A thesis that passed under
0.5.0 can fail under this release, and that is the point of it.

### Changed

- **Writing every stage at once is no longer free.** `init` has withheld the
  later documents since 0.3.0, but withholding was a behaviour of one command,
  and anything writing files directly walked straight past it. Eight stages of
  honest `assumed` claims used to report "No findings" and exit 0 — a complete
  strategy for any idea at all, blessed by the checker. The new
  `stage-opened-early` finding enforces the same ordering the scaffolding
  always implied.

  A stage opens when the stage before it declares at least one critical claim
  and every one of them meets its gate. A stage that declares nothing critical
  is unexamined rather than settled, so it opens nothing.

  Two deliberate exemptions, so the rule punishes slop rather than work in
  progress: a set of claims with no `problem` stage is a fragment and is left
  alone, and so is a thesis that names nothing critical at all.

  If this fires across a thesis you wrote by hand, the honest fix is usually to
  delete the documents ahead of the evidence rather than to weaken the gates.

## 0.5.0

### Added

- **`incident-record`, a method that reaches `indicated` from a desk.** The
  record of one specific occurrence — named identifiers, a date, a URL —
  published by whoever it went wrong for, or by the person it happened to
  before anyone asked. It is not research about a market, so it does not sit
  with `scraping` and `desk-research` at `assumed`.

  Two limits keep it honest, because a method gathered alone at night is the
  easiest one to over-read:
  - It counts on the **problem stage only**. Elsewhere it is an assumption.
  - It can never raise **`problem-is-expensive`** or **`they-already-try`**,
    reported as the new `incident-beyond-occurrence` finding. A record
    establishes that a thing happened. What it cost, and what the person does
    about it, come out only when someone asks them.

## 0.4.0

### Added

- **A GitHub Action, so `check` can fail a build.** `uses: bilhokista/flawline@v0`
  runs the checker over `strategy/` on a pull request. Inputs: `version`,
  `working-directory`, `annotate`. See `docs/ci.md`.
- **`--format text|json|github`.** `github` emits workflow annotations, so a
  finding lands on the claim in the diff rather than in a log nobody opens.
  `--json` still works and means `--format json`. `--format github` is refused
  on anything but `check`, which is the command a build can fail on.
- **Claims carry the line they were declared on.** Only a plainly written `id`
  is matched; a folded or anchored one is annotated at the top of its file
  instead, because a wrong line is worse than an imprecise one.

## 0.3.0

### Changed

- **`init` opens one stage at a time.** It used to write all eight documents at
  once, which invites filling in eight — and a form filled in alone passes the
  checker while establishing nothing. Now only the stage the work is actually in
  exists on disk; the rest are named as withheld and each opens when the stage
  before it holds. Run `init` again to collect the next one. Documents already
  on disk are never touched.

`init` on a thesis that already has its documents changes nothing: existing
files are never touched.

## 0.2.0

Documents that passed `check` under 0.1.0 can fail under this release. Every
change below tightens a rule that was letting weak evidence carry a claim, so a
new failure is a finding rather than a regression.

### Evidence rules

- **An unrecognised `method` no longer carries any confidence.** It counted as
  uncapped, so `method: scraping` could settle a critical claim without a word
  from the checker. It now counts as an assumption, reported as
  `unknown-method`, and stronger evidence recorded beside it still lifts the
  claim.
- **`colleague` and `friend` cap at `assumed`.** They answer about the
  relationship rather than the offer, and the two cannot be separated
  afterwards. The rule was already written in prose and enforced nowhere.
- **`scraping` and `desk-research` cap at `assumed`.** Reading about a market is
  not sampling it.
- **`self-report` only counts on the `advantage` stage**, where the claims are
  about the founder. Anywhere else it is a statement about other people made by
  someone who has not asked them, and it drops to `assumed`.
- **New `field-observation`, at `indicated`.** You worked inside it and watched
  it happen, so nobody was performing for you — which beats an interview. Still
  one witness with nothing at stake, so it stops where interviews stop.
  Watching from outside without that access is deliberately not this.
- **New `signed-contract`, at `validated`**, beside `deposit` and `invoice`.
- **The observation gate counts only observations a method could carry.** Four
  conversations with friends beside one payment used to clear a five-observation
  bar that only the payment could speak to. The message now says how many were
  set aside.

### New

- **`flawline report`** — where the thesis stands, the riskiest claim resting on
  nothing and how much is riding on it, and the one piece of work the evidence
  licenses next. It also names what it refuses to advise on and why: a
  recommendation is held to the same rule as a claim and may not outrun what
  supports it.
- **`report --json` and `check --json`** for another agent to act on.
- **An introduction on first `init`** — what this is, what the confidences mean,
  and that `assumed` is the normal state of day one rather than a grade.

### Fixed

- `status` marked the last stage holding any claim as the furthest reached.
  Since `init` writes claims into every document, every new thesis was told it
  had reached the final stage before a word was written. It now uses the same
  rule as the gate checker: progress is claims that have left `assumed`.
- The help text said seven stage documents and `init` wrote eight. It now counts
  them.
- The published README was a hand-kept copy that had drifted from the root one.
  It is copied on `prepack`, alongside a build, so a publish cannot ship a stale
  `dist` or a stale page.
- The version the CLI reports is read from the manifest rather than typed in a
  second place.

## 0.1.0

First release.
