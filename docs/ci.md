# Running `check` in CI

`flawline check` exits 1 when a claim is stated more strongly than its evidence
allows. That is the whole integration: any runner that can fail a build on a
non-zero exit code can gate a strategy document the way it gates a test suite.

The value is not the automation. It is that upgrading a guess to a fact stops
being a quiet edit and becomes a change someone has to defend in review.

## GitHub Actions

```yaml
name: strategy

on:
  pull_request:
    paths: ['strategy/**']

jobs:
  flawline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bilhokista/flawline@v0
```

Findings land as annotations on the claims themselves, in the diff, so a
reviewer sees which line overstated itself without opening the log.

### Inputs

| Input | Default | What it does |
| --- | --- | --- |
| `version` | `latest` | Version of the npm package to run. Pin it to keep a build reproducible. |
| `working-directory` | `.` | Directory holding `strategy/`. Set it for a monorepo. |
| `annotate` | `true` | Annotate the diff. Set `false` for plain log output. |

Pinned, in a monorepo:

```yaml
      - uses: bilhokista/flawline@v0
        with:
          version: 0.4.0
          working-directory: apps/web
```

## Any other runner

```bash
npx --yes flawline check
```

Exit codes are stable and documented in `flawline --help`:

| Code | Meaning |
| --- | --- |
| 0 | Nothing blocking. |
| 1 | A claim outruns its evidence, or a document could not be read. |
| 2 | The command line was wrong. |

For a machine reading the result rather than a human reading a log:

```bash
npx --yes flawline check --format json
```

The payload is `{ "findings": [...], "blocked": boolean }`. Each finding carries
a stable `code`, the `claimId`, the `source` file and a message written for a
person.

## What to gate, and what not to

Gate the pull request that edits `strategy/`. That is where a claim gets
upgraded, and that is the moment worth interrupting.

Do not gate deploys on it. A blocked thesis is a reason to go and find something
out, not a reason to stop shipping the code you already wrote. A gate that
blocks work people cannot unblock gets removed within a week, and then nothing
is checked at all.

## Warnings

`undated-evidence` is a warning, not an error, and does not fail the build on
its own. A build fails only on findings with severity `error`. If you want
warnings to fail too, read the JSON and decide for yourself:

```bash
npx --yes flawline check --format json > findings.json
jq -e '.findings | length == 0' findings.json
```
