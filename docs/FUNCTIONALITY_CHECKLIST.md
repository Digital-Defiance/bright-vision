# BrightVision functionality checklist (do not lose)

Use this before slimming to upstream `cecli`, opening PRs, or changing the parent submodule SHA.

## Two layers (both required for the desktop app)

| Layer | Location | Role |
|-------|----------|------|
| **cecli** | `cecli/` (upstream engine) | LLM loop, coders, slash commands, agents, MCP |
| **bright_vision_core** | `bright_vision_core/` (**not** in upstream cecli) | HTTP/SSE, streaming tokens, superproject git, todos |

**Upstream cecli PR branch `pr/brightvision-cecli-only` contains only two cecli files.** It does **not** include `bright_vision_core/`. Never point daily dev or the parent submodule at that SHA.

**Layout (current):** `bright_vision_core/` in **BrightVision parent**; cecli in submodule `cecli/` (or legacy `BrightVision-core/` until renamed).

## Tier 1 — must ship in `bright_vision_core/` (shell breaks without these)

| Module | Function |
|--------|----------|
| `http_api.py`, `http_auth.py` | FastAPI routes the React app calls (`/health`, `/sessions`, messages SSE, todos, files, confirm, undo) |
| `session.py` | Turn lifecycle: `yield_stream=True`, `run_message` → `token` events, `done` payload |
| `event_io.py` | Structured events; tokens **not** duplicated to stdout |
| `async_bridge.py` | Async `coder.send_message()` → sync generator for SSE |
| `vision_runtime.py`, `cli_serve.py`, `vision_serve.py` | `bright-vision-core-serve` on `:8741` |
| `git_workspace.py` | Superproject / submodule `RepoSet` (cecli has no equivalent) |
| `workspace_todos.py`, `todo_*.py` | Tasks tab + spec jobs |
| `headless_stdio.py`, `headless_args.py` | Headless / Tauri spawn |
| `gui_progress.py` | Progress → activity bar |
| `model_router.py`, `model_router_apply.py` | Fast/heavy routing (if enabled in settings) |
| `slash_helpers.py` | Slash command glue for HTTP layer |
| `brand.py` | Product strings |

Align event types with parent `src/ipc/events.ts`.

## Tier 1 — cecli deltas we still need (until upstream merges PR)

| File | Why keep |
|------|----------|
| `cecli/commands/add.py` | RepoSet / ignore-path UX for `/add` |
| `cecli/models.py` | Ollama `keep_alive=-1` default |

After upstream merges, drop vendored copies of these hunks and pin `cecli` version instead.

## Streaming (not lost when cecli is vanilla)

1. Upstream `cecli` already streams from `Coder.send_message()` (`yield_stream` flag on `base_coder`).
2. `session.py` sets `self.coder.yield_stream = True` and emits `{"type": "token", "text": ...}` per chunk.
3. `event_io.py` avoids echoing the same text to stdout (dedupe — parent roadmap #1 / #8).
4. React handles SSE in `src/ipc/events.ts`, `chatStream.ts`, `App.tsx`.

No additional `cecli/coders/base_coder.py` fork patches are required on current `main` unless pytest or dogfood shows a gap.

## Verify before claiming “safe to slim”

```bash
cd BrightVision-core
git checkout main   # NOT pr/brightvision-cecli-only
pip install -e .

# No legacy imports
rg 'from aider_vision_core|import aider_vision_core' bright_vision_core/ \
  && echo FAIL || echo OK

# Core gate (parent package.json: test:bright-core)
python -m pytest tests/basic/test_http_api.py \
  tests/basic/test_git_workspace.py \
  tests/basic/test_workspace_todos.py \
  tests/basic/test_http_session_todos.py \
  tests/basic/test_superproject_integration.py -q

# Parent shell
cd .. && yarn test:local
```

Optional (if `aider-vision-core` submodule is present):

```bash
python3 scripts/compare-cores.py --list vision-only
python3 scripts/compare-cores.py --list differ
```

## Parent repo submodule pin

In **BrightVision** (outer repo):

```bash
cd BrightVision-core && git checkout main && cd ..
git add BrightVision-core
# commit when ready — SHA must be main, not pr/brightvision-cecli-only
```

`git submodule status` should **not** show `+` on a PR-only SHA without `bright_vision_core/` on disk.

## Fallback until dogfood is confident

Keep `BRIGHT_VISION_ENGINE=aider-vision-core` and the legacy submodule until compare-cores + pytest + manual chat streaming pass on `BrightVision-core` `main`.
