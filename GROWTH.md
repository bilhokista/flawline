# Growth — 5 bets, not 50 improvements

Adoption devtool is power-law: 4% of moments drive 93% of users.
So no roadmap polish. Five cheap bets, each with a pass/fail number
written before it runs. Decided after, every result is a pass.

| # | Bet | Damage if wrong | Cost to test | Order |
| --- | --- | --- | --- | --- |
| 1 | linter-positioning | search traffic stays flat | 1 afternoon | 1 |
| 2 | hn-launch | one morning burned | 1 morning + 3h thread | 2 |
| 3 | case-study-flywheel | 3 afternoons burned | 3 × 1 afternoon | 3 |
| 4 | agent-distribution | listing ignored | 1 day | 4 |
| 5 | zero-false-positive badge | no trust lift | 1 hour | 1 |

## Bet 1: linter-positioning

- **Assumption:** devs adopt a linter, not a strategy framework.
- **Method:** add npm keywords + GitHub topics: `linter, ci-check, strategy-linter, claude-code, cursor, github-actions`. Change tagline everywhere to "a linter for the claims your business plan rests on".
- **Who:** npm search + GitHub search visitors, counted via npm-stats + repo traffic.
- **Runs until:** 14 days after publish.
- **Passes if:** weekly npm downloads +30% vs prior 4-week mean.
- **Fails if:** flat (±10%).
- **Then:** pass → keep, move to bet 4. Fail → revert tagline, the word is not the bottleneck.

## Bet 2: hn-launch

- **Assumption:** one live HN thread beats 50 small posts.
- **Method:** post `show-hn.md` Tue–Thu 13:00–15:00 UTC. Stay 3h, answer everything including hostile. Never ask for upvotes.
- **Who:** HN front page readers.
- **Runs until:** 7 days after post.
- **Passes if:** >100 points OR >1,000 GitHub stars in 7 days.
- **Fails if:** <20 points and <100 stars.
- **Then:** pass → ride it: pin follow-up case study within 48h. Fail → wait 14 days, relaunch with angle "129 emails, copy wasn't the problem".

## Bet 3: case-study-flywheel

- **Assumption:** one honest teardown beats 8 templates.
- **Method:** publish 3 retroactive teardowns with real numbers: (a) famous startup postmortem re-run through `flawline check`, (b) "400 interviews still indicated", (c) 1 live founder audit. Each with UTM link to repo.
- **Who:** readers of bilhokista.web.app/writing + HN stragglers.
- **Runs until:** 30 days after third publish.
- **Passes if:** any single study drives >500 repo visits.
- **Fails if:** all three <150 visits each.
- **Then:** pass → double down on winner angle only. Fail → stop writing, bottleneck is distribution (bet 2/4), not content.

## Bet 4: agent-distribution

- **Assumption:** installs now happen via agent, not CLI docs.
- **Method:** list plugin in Claude Plugin Marketplace + Cursor directory. Lead with "writes 1 file first (problem.md), 7 stay shut" — the `openStages` insight. Add 1 agent-loop example reading `report --json`.
- **Who:** Claude Code / Cursor users.
- **Runs until:** 30 days after listing.
- **Passes if:** >100 skill installs (marketplace stats / GH clones of `skills/`).
- **Fails if:** <20.
- **Then:** pass → add `--json` cookbook for agents. Fail → kill listings, agents don't install via directory.

## Bet 5: zero-false-positive badge

- **Assumption:** trust is the moat in the AI-slop era.
- **Method:** public badge `false-positive: 0 reported` + keep minimal-repro issue template. Count every false-positive issue as P0.
- **Who:** evaluators skimming README.
- **Runs until:** 60 days.
- **Passes if:** 0 false-positive issues AND ≥1 external contributor confirms a catch in an issue.
- **Fails if:** ≥1 false positive, or zero external confirmations.
- **Then:** pass → keep badge, it compounds. Fail (false positive) → fix + test first per CONTRIBUTING, reset clock. Fail (no confirmation) → badge is decoration, remove it.
