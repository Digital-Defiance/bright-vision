# Upstream cecli strategy (post-merge)

**Context (May 2026):** The cecli maintainer is merging most of our engine changes upstream. We will **not** maintain a long-lived “second product fork” of cecli. The **BrightVision** repo keeps the desktop shell; the engine becomes **`cecli` (upstream) + `bright_vision_core` (thin Vision layer only)**.

**PR fork:** Keep a git remote/branch only for **open PRs** and short-lived integration — not as the default dev path.

**Pin policy (ship before PyPI / before `main`):** [CECLI_PIN.md](./CECLI_PIN.md)

---

## Target layout (post-transition)

See **[ENGINE_TRANSITION.md](./ENGINE_TRANSITION.md)** for the full cutover runbook.

```text
dwash96/cecli (upstream)              ← terminal agent (cecli.dev)
        ↑ submodule or pip pin
Digital-Defiance/cecli (PR fork)      ← submodule cecli/ in BrightVision repo
bright_vision_core/                   ← in BrightVision parent repo (NOT in cecli fork)
        ↑ pip install -e .  (PyPI name may stay bright-vision-core for Vision-only wheel)
BrightVision/                         ← Tauri + React; docs/index.html
```

**Retired:** monolithic `BrightVision-core/` submodule and “BrightVision Core” as the engine brand.

| Keep maintaining | Stop maintaining in our fork |
|------------------|------------------------------|
| `bright_vision_core/*.py` | `cecli/website/` (~upstream docs; **do not edit**) |
| `bright_vision_core` tests | Rebranded copies of cecli docs inside `cecli/` |
| `scripts/vision_serve.py`, `cli_serve` | Whole-tree cecli vendor when upstream + PyPI suffice |
| Parent `docs/index.html` (product site) | `bright-vision-core.digitaldefiance.org` as a second Jekyll tree (unless needed) |
| PyPI package **`bright-vision-core`** (Vision layer + pin on `cecli`) | Publishing a separate “cecli fork” product |

---

## What `bright_vision_core` must contain (code only)

These are the **only** modules the shell depends on ([CORE_FILE_MERGE.md](./CORE_FILE_MERGE.md) Tier 1):

| Module | Role |
|--------|------|
| `http_api.py`, `http_auth.py` | FastAPI + SSE |
| `session.py`, `vision_runtime.py`, `cli_serve.py` | Turn lifecycle, `bright-vision-core-serve` |
| `git_workspace.py` | Superproject / submodule `RepoSet` |
| `workspace_todos.py`, `todo_*.py` | Tasks tab |
| `headless_stdio.py`, `event_io.py` | Headless events → `src/ipc/events.ts` |
| `brand.py` | Product strings (align with `src/brand.ts`) |
| `async_bridge.py`, helpers | Adapter to **cecli** coders/commands |

Everything else (LLM loop, slash commands, agents, MCP, skills) comes from **installed `cecli`**, not a copied tree.

### Do not lose functionality

| Keep | Do not confuse with |
|------|---------------------|
| Full **`BrightVision-core` `main`** (vendored `cecli/` + `bright_vision_core/`) | PR branch `pr/brightvision-cecli-only` (2 cecli files only) |
| Streaming, HTTP, todos, superproject git in **`bright_vision_core/`** | Patches inside `cecli/coders/base_coder.py` (upstream already streams; Vision wires it) |

Checklist and verify commands: [BrightVision-core/docs/FUNCTIONALITY_CHECKLIST.md](../BrightVision-core/docs/FUNCTIONALITY_CHECKLIST.md).

**Submodule pin:** parent repo must track `BrightVision-core` **`main`**, not the upstream-PR SHA.

---

## Slim-down checklist (BrightVision-core repo)

Work in this order; update this section as items complete.

### 1. Inventory fork delta vs upstream

```bash
cd BrightVision-core
git remote add upstream https://github.com/dwash96/cecli.git 2>/dev/null || true
git fetch upstream
git diff --stat upstream/main...HEAD -- cecli/ | head -40
git diff --stat upstream/main...HEAD -- ':!cecli/website' | head -40
```

- **Merged upstream:** delete our copy of those paths from the fork (or reset `cecli/` to upstream tag).
- **Open PR:** keep on a branch; do not treat as permanent fork surface.
- **Vision-only:** should live under `bright_vision_core/`, not `cecli/`.

### 2. Freeze website work

| Path | Action |
|------|--------|
| `cecli/website/` | **No edits.** Docs live at [cecli.dev](https://cecli.dev). Exclude from wheels if still vendored (see `pyproject.toml` / package-data). |
| `bright_vision_core/website/` | **Removed** — not shipped in BrightVision; product docs in `docs/index.html`, CLI docs at [cecli.dev](https://cecli.dev). |
| Parent `docs/index.html` | **Canonical** BrightVision install/onboarding site. |

### 3. Depend on cecli instead of vendoring (goal)

**Today (transitional):** `BrightVision-core/` submodule = vendored `cecli/` + `bright_vision_core/`; `pip install -e BrightVision-core`.

**Target:**

```toml
# bright-vision-core/pyproject.toml (future)
dependencies = [
  "cecli>=<pinned>",
  ...
]
# packages.find → only bright_vision_core*
```

```bash
# Dev — parent repo
pip install "cecli @ git+https://github.com/dwash96/cecli@main"   # or cecli-dev from PyPI
pip install -e BrightVision-core   # only installs bright_vision_core
```

Until packaging splits, use env override for experiments:

```bash
export CECLI_INSTALL=upstream   # document in activate.sh when implemented
source activate.sh
```

### 4. Submodule / repo naming

| Piece | Recommendation |
|-------|----------------|
| Submodule path **`cecli/`** | Points to **`Digital-Defiance/cecli`** (PR fork; sync `upstream` = dwash96/cecli) |
| **`bright_vision_core/`** | Lives in **BrightVision parent repo**, not in the cecli fork |
| `Digital-Defiance/BrightVision-core` | **Archive** after split; README → ENGINE_TRANSITION.md |
| `aider-vision-core` submodule | Deinit when upstream + parent `bright_vision_core` cover dogfood |

### 5. Release model

| Artifact | Contents |
|----------|----------|
| PyPI **`cecli`** / **`cecli-dev`** | Maintained by upstream |
| PyPI **`bright-vision-core`** | `bright_vision_core` + depends on `cecli` |
| Desktop app | Pins `requirements-core.txt` → `bright-vision-core==…` (pulls cecli transitively) |

---

## Daily development (once slimmed)

```bash
# Parent superproject
git submodule update --init BrightVision-core
source activate.sh          # editable bright_vision_core + cecli from pin/upstream
yarn tauri dev

# When hacking cecli itself (rare)
pip install -e /path/to/cecli-checkout
pip install -e BrightVision-core
```

For features that need **unreleased cecli**, install from git SHA and note the pin in PR description — do not commit a full vendored `cecli/` snapshot unless submodule policy requires it temporarily.

---

## Docs map (avoid duplication)

| Audience | URL / path |
|----------|------------|
| BrightVision desktop | `docs/index.html` → bright-vision.digitaldefiance.org |
| cecli CLI / agents / MCP | upstream `cecli/website` → cecli.dev |
| Vision HTTP API | `bright_vision_core/README.md`, [IPC.md](./IPC.md) |
| Engine merge rules | [CORE_FILE_MERGE.md](./CORE_FILE_MERGE.md) (historical port tiers) |
| Old port execution | [CECLI_MIGRATION_ROADMAP.md](./CECLI_MIGRATION_ROADMAP.md) (archive when slim-down done) |

---

## Agent instructions

1. **Do not** add or rebrand files under `cecli/website/`.
2. **Do** put new engine behavior in `bright_vision_core/` and import from `cecli.*`.
3. **Prefer** upstream cecli for bugfixes that are not Vision-HTTP-specific; contribute PRs there.
4. **Update** [ROADMAP.md](./ROADMAP.md) when slim-down milestones land.

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| U1 | Inventory: list cecli diff vs `upstream/main` excluding `website/` | **Done** — only `cecli/commands/add.py`, `cecli/models.py` |
| U1b | Branch `pr/brightvision-cecli-only` → PR to cecli-dev | **Done** — [#530](https://github.com/cecli-dev/cecli/pull/530) on `v0.100.1`; pin per [CECLI_PIN.md](./CECLI_PIN.md) |
| U2 | Upstream merges agreed; delete merged hunks from fork | Open |
| U3 | Parent `pyproject.toml`: Vision wheel depends on cecli; packages only `bright_vision_core` | Open — [ENGINE_TRANSITION.md](./ENGINE_TRANSITION.md) Phase 2 |
| U4 | Submodule `cecli/` + `activate.sh` installs cecli + parent Vision layer | Open — Phase 3–4 |
| U5 | Deinit `BrightVision-core` + `aider-vision-core` submodules | Open — Phase 3–6 |
| U6 | Mark [CECLI_MIGRATION_ROADMAP.md](./CECLI_MIGRATION_ROADMAP.md) port phases **Done** / archive | Partial |
