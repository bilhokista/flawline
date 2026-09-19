# Changelog

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
