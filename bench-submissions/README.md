# Bench card submissions (private to repo, public aggregate only)

Each file is one **bench card** (aggregate stats only — never raw CSV or chat).

## Submit

1. **Recommended:** [Local LLM bench](/bench/) on the docs site — upload BrightVision timing CSV, preview, copy JSON, open a PR.
2. **Issue:** [Submit bench card](https://github.com/Digital-Defiance/BrightVision/issues/new?template=bench-card.yml) — GitHub sets `submittedBy` automatically.

## File rules

- Name: `your-handle-or-unique-id.json` (e.g. `nova-7b-q4.json`)
- `schemaVersion`: `1`
- `displayName`: public nickname (1–32 chars, `a-z`, `0-9`, `_`, `-`)
- `hideGitHubOnWall`: `true` to omit `@login` from the public leaderboard
- `submittedBy`: set by maintainers/CI from GitHub — do not impersonate others
- `stats`: from the bench page or Settings timing export

After merge to `main`, CI rebuilds [`docs/data/leaderboard.v1.json`](../docs/data/leaderboard.v1.json).
