# Changelog

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
