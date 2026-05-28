# Dogfooding BrightVision (self-dev)

Use **BrightVision on BrightVision** with a **local Ollama** model — no Cursor/cloud required for day-to-day hacking on this repo.

## Goal

| Layer | What “100% dogfood” means |
|-------|---------------------------|
| **Workspace** | Settings → project = **repo root** (`BrightVision/`), not `cecli/` alone |
| **Engine** | Bundled Vision HTTP (`bright_vision_core` + `cecli` submodule) via **Terminal → Start** |
| **Model** | `ollama_chat/…` from `local-llm.env`; **Local LLM → Start** before session |
| **Validation** | Automated checks below + manual A–D when you change git/submodule behavior |

## One-time setup (M4 / macOS)

```bash
cd /path/to/BrightVision
git submodule update --init --recursive cecli
source activate.sh
yarn install
yarn dogfood:setup    # writes local-llm.env + pulls fast/heavy Ollama models (M4-friendly)
# or: cp local-llm.env.example local-llm.env && ollama pull …
```

Install [Ollama](https://ollama.com/) if `yarn dogfood:setup` is not used.

In the app: **Settings → Ollama env files → Sync from env files** → **Terminal → Local LLM → Start** → **Terminal → Start** (session).

## Daily loop

```bash
source activate.sh
yarn dogfood:check          # fast preflight (no GUI)
yarn tauri dev              # desktop dogfood
```

Inside the app:

1. Confirm **project path** = superproject root (welcome or Settings).
2. **Chat** — small change in `src/` or `bright_vision_core/`; confirm **Applied** on disk.
3. **Tasks** — one **Generate spec** + one **Implement** step on a real todo (proves core + workspace API).
4. **Git** tab — stage/commit in the right repo (parent vs `cecli/` submodule).
5. Before larger merges: `yarn test:local` and, when `.venv` exists, `yarn test:e2e:integration`.

## Automated preflight

```bash
yarn dogfood:check
```

Runs: `activate.sh` sanity, `yarn verify:submodule`, `yarn test:fast`, optional Ollama reachability, optional `yarn test:bright-core` when `.venv` is present.

## Automated gate (hands-off)

```bash
yarn dogfood:gate
# With Ollama running and models pulled:
DOGFOOD_LLM=1 yarn dogfood:gate
# Include slow superproject-root LLM lane:
DOGFOOD_LLM=1 DOGFOOD_SUPERPROJECT_LLM=1 yarn dogfood:gate
```

Runs: `dogfood:check` → `test-local.sh release` (mocked e2e + bright-core + integration). When `DOGFOOD_LLM=1`, also `yarn test:llm:core` and `yarn test:e2e:llm` (same stack as daily dogfood, including router when `E2E_MODEL_ROUTER=1` in package.json).

## Manual sign-off (#19)

When submodule or `git_workspace` behavior changes, run [SUBMODULE_VERIFICATION.md](./SUBMODULE_VERIFICATION.md) sections **A–D** in `yarn tauri dev`.

## Self-dev prompts (copy/paste)

**Smoke (fast tier):**

> Read `bright_vision_core/session.py` and summarize how `Session.create` sets `fnames` for the workspace root.

**Context + edit (superproject):**

> `/add bright_vision_core/http_api.py` — add a one-line docstring note that this is the BrightVision Vision HTTP API. Show SEARCH/REPLACE only; I will apply from the UI.

**Tasks + spec:**

> In Tasks, create a todo “Dogfood checklist doc”, generate spec layers, then implement the first implementation task only.

## Friction → roadmap

When something blocks daily use, either fix it in-session or add a row to [ROADMAP.md](./ROADMAP.md) with:

- workspace path, file path, model, expected vs actual
- whether the bug is UI, Vision HTTP, cecli, or Ollama

**Watch list** (from roadmap): wrong workspace root, proposed vs applied edits, commit in wrong repo, stuck Connecting (`:8741`), asyncio “Task was destroyed” after Stop (usually harmless).

## Local LLM on Apple Silicon

See [LOCAL_LLM.md](./LOCAL_LLM.md). Prefer one **fast** + one **heavy** model in Settings hopper; enable **model router** when VRAM is tight.

**Optional** release-tier gate before tagging:

```bash
sh scripts/test-local.sh release   # bright-core + integration e2e when .venv exists
```

## Related

- [USER_WORKFLOW.md](./USER_WORKFLOW.md) — install paths
- [SUBMODULE_VERIFICATION.md](./SUBMODULE_VERIFICATION.md) — superproject + `cecli/`
- [TESTING.md](./TESTING.md) — test pyramid
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — stuck session / orphaned API
