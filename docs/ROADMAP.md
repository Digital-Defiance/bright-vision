# BrightVision Roadmap

Living backlog for chat UX, engine behavior, spec-driven work, and charter-level evolution ([AGENTS.md](../AGENTS.md) § Evolution).

**Public summary:** [README.md](../README.md#-roadmap-status) · [docs site](https://bright-vision.digitaldefiance.org/#roadmap) (`docs/index.html`). Update those summaries when statuses change here.

**Agents:** Read this file before substantive work; follow **Suggested fix order** until open items are **Done**; update statuses in the same session when you ship or learn something new. Instructions: `AGENTS.md` (Product roadmap) and `.cursor/rules/roadmap.mdc`.

## Current focus — Cecli + Vision API (Priority)

**Status:** `bright_vision_core/` in this repo; agent via `cecli/` submodule ([UPSTREAM_CECLI.md](./UPSTREAM_CECLI.md)). **Next:** upstream cecli pin after [#530](https://github.com/cecli-dev/cecli/pull/530); `pyproject.toml` depends on `cecli` (U3).

| Doc | Use when |
|-----|----------|
| [UPSTREAM_CECLI.md](./UPSTREAM_CECLI.md) | **Layout & strategy** — Cecli submodule + Vision HTTP in parent |
| [CECLI_PIN.md](./CECLI_PIN.md) | **Pin policy** — submodule SHA, integration branches |
| [CORE_FILE_MERGE.md](./CORE_FILE_MERGE.md) | Per-file PORT_NEW / MERGE_HUNKS for Vision layer |
| [CECLI_MIGRATION_ROADMAP.md](./CECLI_MIGRATION_ROADMAP.md) | Port gate checklist (phases A–B) |
| [ENGINE_TRANSITION.md](./ENGINE_TRANSITION.md) | Optional integration tasks (PyPI, CI) |

---

## Dogfooding (after engine swap)

Primary validation mode: **automated agent dogfood** on the superproject (`yarn dogfood:agent`) — Vision HTTP, pytest, integration e2e, optional Ollama — not manual GUI clicking.

| Doc | Use when |
|-----|----------|
| [DOGFOOD.md](./DOGFOOD.md) | **Agent-first dogfood** — `yarn dogfood:agent`, headless gate, optional `DOGFOOD_LLM=1`, friction → tests |
| [USER_WORKFLOW.md](./USER_WORKFLOW.md) | Workspace = **superproject root** (repo root), not `cecli/` alone |
| [SUBMODULE_VERIFICATION.md](./SUBMODULE_VERIFICATION.md) | Editing files under `bright-vision-core/` + parent tree in one session |
| [TESTING.md](./TESTING.md) | Before/after sessions: `yarn test:local` (quick), `yarn test:full` before larger changes |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Stuck Connecting, orphaned `:8741`, Stop vs Start |

Log dogfooding bugs as roadmap rows or issues with repro (workspace path, file path, expected vs actual commit repo).

## Status legend

| Status | Meaning |
|--------|---------|
| Done | Shipped in repo (parent UI and/or `bright-vision-core` submodule) |
| Open | Not started or in progress |
| Partial | Some behavior exists; gaps documented |
| Longer-term | Strategic; design before build |
| **Priority** | Do before routine UX backlog unless user says otherwise |

---

## Priority — workspace & submodules

| # | Status | Item |
|---|--------|------|
| **19** | **Done** | **Automated (primary):** `yarn dogfood:agent` (`dogfood:check` + `dogfood:gate`), `test_superproject_dogfood.py`, `yarn verify:submodule`, `test_git_workspace.py`, `test_superproject_integration.py`, `yarn test:bright-core`, `yarn test:e2e:integration`, LLM lanes (`test:llm:core`, `test:e2e:llm`, opt-in `E2E_SUPERPROJECT_LLM`). **Optional release spot-check:** SUBMODULE_VERIFICATION A–D in `yarn tauri dev` (native shell only). |
| **31** | **Done** | **Release hygiene** — `release-hygiene.spec.ts`, `yarn verify:submodule`, [RELEASE.md](./RELEASE.md) commit/tag/bump checklist. |

---

## Chat & output UX

| # | Status | Item |
|---|--------|------|
| 1 | **Done** | Stream dedupe — core skips stdout when `yield_stream`; UI `appendStreamingToken` for cumulative chunks; timeline interleaves tools (`stream-chat.spec.ts`) |
| 2 | **Done** | Proposed edits → accordions + CM6 fence; **Apply to workspace** (desktop, exact + fuzzy SEARCH/REPLACE: trailing-space, indent drift, single-line trim); dedupe path-only fences + redundant tool_output; **Applied** chip from `done.edited_files` or manual apply. **Tests:** `proposed-edits-apply.spec.ts`, `applyProposedEdit.test.ts`, `chat-ux.spec.ts`. |
| 8 | **Done** | Duplicate assistant text (same stdout fix as #1) |
| 9 | **Done** | Basic section chips for `► **THINKING**` / `► **ANSWER**` (`splitAssistantSections`) |
| 10 | **Done** | Dismiss (×) on chat bubbles |
| 11 | **Done** | Chat / tool / terminal list caps (`MAX_*` in `chatStream.ts`) |
| 13 | **Done** | Token stats footer (`TokenStatsBar`, parses `Tokens:` tool_output) |
| 15 | **Done** | Suppress empty `tool_output` in `App.tsx` + `ChatPanel` |
| 6 | **Done** | Full-width chat (`ChatPanel` drops `maxWidth="md"`) |
| **25** | **Done** | Richer assistant section parser — multiple markers per message (`**THINKING**` / `**ANSWER**` / `**REASONING**`); **GFM markdown** for prose (`ChatMarkdown`, `react-markdown`). **Tests:** `ChatMarkdown.test.ts`, `chat-ux.spec.ts`. |

## Input & session control

| # | Status | Item |
|---|--------|------|
| 5 | **Done** | Multiline input: Shift+Return newline, Enter to send |
| 3 | **Done** | Stop in-flight turn (`cancelSend` + AbortSignal on fetch) |
| 4 | **Done** | Queue messages while busy (`useVisionSession` queue + Queue button in `ChatPanel`) |
| 12 | **Done** | `/add` / `/drop` path completion via Tauri `complete_workspace_path` + Tab in chat |
| **33** | **Partial** | **Cecli session persistence** — `--auto-save` / `--auto-load` (defaults on), `.cecli/chat.history`, optional AES-256-GCM; **UI hydrate** via `GET /sessions/{id}/transcript` after auto-load and `/load-session` (`session_transcript.py`, `App.tsx`). **Tests:** `test_session_transcript.py`, existing session tests. **Open:** encrypt `chat.history`; upstream cecli PR. |
| **32** | **Done** | **Suggested files tray** — parse assistant **Answer** for repo-relative paths; tray with **Add all**, **Add while busy**, dismiss, open in editor; `addFiles` batch. **Tests:** `suggested-files.spec.ts`, `suggestedFiles.test.ts`. **Open:** structured `suggested_files` SSE from core; tree picker tie-in (#28). See [§ #32 design](#32-suggested-files--queued-add) |

## Approvals, workspace & engine

| # | Status | Item |
|---|--------|------|
| 7 | **Done** | Confirm flow: `yes=False` default, `POST /sessions/{id}/confirm`, UI Yes/No + auto-approve countdown |
| 14 | **Done** | No longer pass workspace dir as chat file (`Session.create` empty `fnames`) |
| 17 | **Done** | Settings: prompt before commit → `auto_commits: false` on session create |
| **41** | **Done** | **About dialog** — header/rail logo → versions + [Digital Defiance](https://digitaldefiance.org) 501(c)(3) + Cecli credit (`AboutDialog`, `AppVersionSection`, e2e `about-dialog.spec.ts`). |
| — | **Done** | Terminate `:8741` Vision API on app quit (Tauri) |
| — | **Done** | **Core API lifecycle** — Start/Stop tied to activity-bar phases (`sessionLifecycle`), cancel in-flight start, `start_core_api` timeout, health fetch timeouts, port cleanup on stop/launch, SSE reader release ([TROUBLESHOOTING.md](./TROUBLESHOOTING.md)) |

## Multi-modal & platform

| # | Status | Item |
|---|--------|------|
| 16 | **Done** | Attach images/PDF via chat (Tauri picker + browser upload → `/sessions/{id}/files`) |
| **33** | **Done** | **Resource overlay** — bottom-left CPU/RAM/GPU HUD (system-wide; GPU via `nvidia-smi` when present); Settings toggles. Tauri desktop only. **Tests:** `resource-overlay.spec.ts`. **Open:** process-scoped CPU, non-NVIDIA GPU. See [§ #33](#33-resource-overlay-cpugpu) |
| **34** | **Done** | **Thinking timers** — live elapsed on current section; durations on completed chips; per-model averages in Settings. **Tests:** `thinkingTiming.test.ts`, `chat-ux.spec.ts`. See [§ #34 design](#34-thinking-timers) |
| **35** | **Done** | **Context window awareness** — header chip: file count + `Tokens:` / ~added estimate; sync after `done` + `/add`. **Tests:** `session-context.spec.ts`, `contextUsage.test.ts`. **Open:** core-reported context % bar. See [§ #35](#35-context-window--file-counter) |
| **36** | **Done** | **LLM ping** — Settings **Ping LLM**: Ollama tags + 1-token generate + core `/health`. **Tests:** `local-llm-ping.spec.ts`. See [§ #36](#36-llm-ping) |
| **37** | **Done** | **Empty LLM response** — rewrite legacy “provider account” copy for Ollama; **Retry** (exact resend) + **Retry with hint** (append nudge); remember last user message in `App.tsx`. `emptyLlmResponse.ts`, `EmptyLlmWarning.tsx`. **Cecli fork:** `base_coder.empty_llm_tool_warning()` for tool_output path. |
| **38** | **Done** | **Editor** — left-rail tab; file tabs + CM6 + explorer + git badges + open-from-chat; optional language packs (Settings). See [§ #38](#38--editor-rail-tab--file-tabs--explorer) |
| **39** | **Done** | **Local model router** — hopper, Tauri preload/swap, chat escalate + force tier. **Tests:** `router-llm.spec.ts` (LLM lane), existing unit coverage. See [§ #39](#39--local-model-router) |
| **40** | **Done** | **cecli agents in Vision (v1)** — chat agent bar, Settings registry, `GET …/subagents`, slash fallbacks. **Tests:** `agents-bar.spec.ts`. **Open (v2):** `POST …/agents/invoke`, header pill. See [§ #40](#40--cecli-agents-in-vision) |
| **42** | **Done** | **Mobile alerts (ntfy)** — Settings topic + test ping; Tauri POST on turn `done`. **Tests:** `ntfy-alerts.spec.ts` (settings test ping + mock turn-`done` push). See [MOBILE_ALERTS.md](./MOBILE_ALERTS.md) |
| **43** | **Done** | **LLM fixture packs for e2e** — external curated workspace collection via `E2E_FIXTURE_PACK_ROOT` (submodule-friendly), in-repo fallback, plus `scripts/verify-e2e-fixture-pack.sh` (`yarn test:e2e:fixtures`) for structure + optional pin-status preflight. |
| **44** | **Done** | **Session debug export** — `GET /sessions/{id}/debug` JSON bundle (messages, tool_calls, duplicate hints, agent todo, EventIO ring); Settings **Session history → Export debug bundle**. See [IPC.md](./IPC.md). |

## Spec-driven development (#18)

**Goal:** Kiro-*inspired* spec-driven work without cloning Kiro’s IDE. Shipped v1–v5; gaps vs Kiro tracked as **#20–22** below.

| Phase | Status | Scope |
|-------|--------|--------|
| v1 | **Done** | Tasks tab, `.cecli/todos.json`, active task chip, spec inject, `/todo` in core |
| v2 | **Done** | Session todos HTTP API, `active_todo_id` / `inject_todo_spec`, templates, checklist |
| v3 | **Done** | Workspace todos HTTP, checklist auto-complete, markdown import/export |
| v4a | **Done** | Three-layer specs, `depends_on`, `spec-driven` template, `.cecli/specs/{id}/` sync |
| v4b | **Done** | AI generate/refine spec, steered **Implement** per implementation task. **Tests:** `tasks-generate-spec.spec.ts`, `test_generate_spec_parse.py`, `test_http_generate_spec_mock.py`; LLM: `spec-generate-llm.spec.ts` @spec-gen, `test_generate_spec_llm.py` (`E2E_LLM=1`) |
| v5 | **Done** | Background `generate-spec` jobs; ephemeral session; job poll |

| # | Status | Item |
|---|--------|------|
| 18a–18e | **Done** | Core/UI todos API, generate/refine, steered steps, reload spec from disk |

### Kiro / spec parity (from [SPEC_DRIVEN_DEV.md](./SPEC_DRIVEN_DEV.md))

| # | Status | Item |
|---|--------|------|
| **20** | **Partial** | **Spec agent** — **Spec** tab + **Settings → session mode** (`vibe` \| `spec`); spec_focus; `.cecli/steering`. **Open:** save-triggered hook automation (beyond PATCH EARS fields). |
| **21** | **Partial** | **EARS module** — **v1 shipped:** `bright_vision_core/ears/`, lint/index/trace HTTP + Tasks, generate/refine gate, Spec tab; pytest + mocked/LLM e2e (`tasks-ears*`, `spec-generate-llm`, `test_generate_spec_llm`). **Open:** lint-on-save blur, stricter trace, pre-commit gate. [EARS_MODULE.md](./EARS_MODULE.md) |
| **22** | **Partial** | Repo-wide spec index — **v1 shipped:** `GET …/spec-index`, **Check spec index**, **Repair folders**, `tasks-ears-index.spec.ts`. **Open:** re-index after generate-spec / todo save. |

---

## Charter evolution ([AGENTS.md](../AGENTS.md) § Evolution Roadmap)

Maps the high-level product charter to tracked work. Items **23–24** are largely satisfied by the tactical rows above; **25–29** carry the remaining charter intent.

| # | Status | Charter theme | Tactical mapping / gap |
|---|--------|---------------|-------------------------|
| **23** | **Done** | Process & terminal integration | Vision HTTP/SSE, `useVisionSession`, stop/queue, Tauri core spawn, terminal stream, reliable start/stop lifecycle |
| **24** | **Done** | LLM chat interface | Chat panel, markdown, proposed edits, confirms, token stats |
| **25** | **Done** | (overlap) Richer chat sections | Same as chat **#25** |
| **26** | **Partial** | File system watcher | Git status polls on **Git** tab + while session runs (8s); native FS notify still open |
| **27** | **Done** | Git visualization (charter §3) | Working tree, inline diffs, commit graph + details, stage all/file, auto-stage on `done`, undo + refresh. **Nice-to-have:** syntax-highlighted diffs |
| **28** | **Done** | Context awareness (charter §5) | Images/PDF, `/add`, folder attach, **suggested-files tray (#32)**, open-in-editor (#38). **Tests:** `chat-context.spec.ts`, `suggested-files.spec.ts`. **Open:** modified-file highlights (**#26**) |
| **29** | **Longer-term** | Plugin / extension system | Custom Rust commands, third-party LLM providers, packaged extensions |
| **30** | **Partial** | Web / non-Tauri parity | **Done:** folder path attach, localStorage todos, Vite `/api/core` proxy; `/add` Tab on **desktop** (#12). **Open:** `/add` Tab on web-only dev; full generate-spec UX without desktop (dogfood Tasks tab on desktop first). |

---

## #32 — Suggested files & queued `/add`

**Problem:** The model often ends with a bullet list of paths (“Please add these files…”) but the user must copy each path into chat as `/add …` one by one.

**Goal:** First-class context UX aligned with dogfooding and spec work (#18–22).

### Behavior (target)

1. **Detect** — After an assistant turn, parse the **Answer** section (► **ANSWER**, `**ANSWER**`, or `Answer` heading) for workspace-relative paths: backtick paths in bullet lists, e.g. `` `src/todos/types.ts` ``.
2. **Accumulate** — Merge into a session-scoped **Suggested** list (dedupe, drop paths already in `files_in_chat`).
3. **Tray UI** — Chips or list near chat input: path, remove, “Add”, “Add all”, “Queue `/add`s”.
4. **Queue `/add`s** — Single batch `addFiles(paths)` (same as Add all); does not enqueue per-file chat `/add` messages.
5. **Add all** — Same batch `addFiles(paths)` API.

### Parser spike (in repo)

`src/utils/suggestedFiles.ts` + tests — extracts the Kiro/spec example list into seven paths and builds:

```text
/add bright-vision-core/bright_vision_core/todo_spec_generate.py
/add bright-vision-core/bright_vision_core/workspace_todos.py
… (one queued message per path)
```

**Shipped (Done):** `SuggestedFilesTray`, **Add all**, **Add while busy**, open in editor, Settings toggles. **Tests:** `e2e/suggested-files.spec.ts`. **Open:** structured `suggested_files` SSE from core.

### Out of scope (v1)

- Core emitting structured `suggested_files` SSE (parser-first in UI).
- Auto-queue without confirmation.
- `/drop` suggestions.

---

## #33 — Resource overlay (CPU/GPU %)

**Problem:** Long local-LLM / core sessions spike CPU/GPU; users want at-a-glance load without leaving Vision or opening Activity Monitor / `nvidia-smi`.

**Goal:** Small, non-intrusive HUD — default **bottom-left** of the main content area (above snackbars, not covering the left nav rail). Configurable in **Settings → Appearance** (or **System**): enable overlay, refresh interval (e.g. 1–5 s), metric set, optional warn tint above threshold.

### Multi-platform feasibility

| Metric | macOS | Linux | Windows | Notes |
|--------|-------|-------|---------|--------|
| **CPU %** (system or process) | Yes | Yes | Yes | Rust [`sysinfo`](https://crates.io/crates/sysinfo) in Tauri; poll on background task, `invoke('get_resource_snapshot')` |
| **RAM** (used / %) | Yes | Yes | Yes | Same crate; cheap and reliable |
| **GPU %** (utilization) | Partial | Partial | Partial | **Not one portable API.** v1 may omit GPU or show “—” with tooltip “GPU stats unavailable on this OS” |
| **Web / `yarn dev` only** | N/A | N/A | N/A | Hide overlay or show disabled chip — aligns with **#30** (no fake numbers from browser) |

**GPU v2 options (pick per OS in Rust, behind feature flags):**

- **macOS:** IOKit / `powermetrics`-style sampling, or vendor tools if installed; Apple Silicon often reports GPU via `ioreg` / Metal counters — needs spike per target OS version.
- **Linux:** Parse `nvidia-smi` / `rocm-smi` when present; AMD/Intel via sysfs where exposed; fallback none.
- **Windows:** DXGI / Performance Counters / `nvidia-smi` — separate code path.

**Process-scoped mode (recommended v1):** Aggregate CPU/RAM for PIDs Vision already knows — `aider` / core Python, optional **Ollama** when `manageLocalLlm` + local model — so the overlay answers “is *my session* melting the machine?” without claiming full-system GPU on every laptop.

### Suggested implementation sketch

1. **Rust:** `resource_monitor.rs` — `sysinfo` refresh every N ms; optional child-PID list from session spawn handles; serde snapshot `{ cpu_pct, mem_used_mb, mem_pct, gpu_pct?: number | null, label }`.
2. **Tauri command** + event emit optional (`resource-snapshot` every poll) to avoid polling from JS.
3. **React:** `ResourceOverlay.tsx` — `position: fixed; left: …; bottom: …; pointer-events: none` (or `auto` for expand-on-hover); respect `AppearanceConfig` + `prefers-reduced-motion` (pause animation, still allow static %).
4. **Settings:** toggles persisted in `localStorage` / config JSON like appearance fonts.
5. **e2e:** mock `get_resource_snapshot` fixed values; assert overlay visible when enabled.

### Difficulty (honest)

| Scope | Rating |
|-------|--------|
| CPU + RAM overlay, system-wide, macOS + Linux | **~4/10** |
| + process-scoped (core + ollama children) | **~5/10** |
| + GPU % with graceful fallback on all three OSes | **~7/10** |
| Always-on-top / screen-wide overlay (true HUD outside window) | **Out of scope** — separate window / OS APIs; not bottom-left *in-app* |

### Out of scope (v1)

- Historical graphs / logging to disk.
- Per-GPU die temperature fan curves.
- Replacing macOS Menu Bar widgets or Linux `conky`.

**Shipped (Partial):** `get_resource_snapshot` (sysinfo) + `ResourceOverlay` fixed bottom-left; Settings → Resource overlay (interval, GPU line, CPU warn threshold).

**Open:** Process-scoped CPU (core + Ollama PIDs); Apple/AMD GPU without `nvidia-smi`; history sparkline.

---

## #34 — Thinking timers

**Problem:** Long “Thinking” stretches feel opaque; no way to compare model latency across prompts.

**Shipped (Partial):**

1. **Live bar** above chat input (`ThinkingTimerBar`) while the agent is busy — current section label + active elapsed + turn elapsed.
2. **Completed messages** — chip labels like `Thinking · 4.2s`; caption `Turn 12.1s · thought 8.0s` when markers present.
3. **Settings → Thinking timers** — toggles for live timer, section durations, turn total, model stats panel.
4. **Persistence** — `bright-vision-thinking-stats` in `localStorage`: rolling samples per `config.model`, avg thought ms and ~ms per 1k prompt chars.

**Detection:** Section boundaries from streamed `► **THINKING**` / `**REASONING**` / `**ANSWER**` markers (`getActiveAssistantSection`); timer runs for the whole turn until `done` (survives tool_output gaps that split assistant bubbles).

**Known context:** Response time is anchored at **Send** (`turnWallStartMsRef`); Stop no longer resets that anchor before `done`. Timing attaches only to the assistant bubble for the current turn (not an earlier message). **Queued sends** keep per-message Send time and restart the live timer after `done` when more messages are queued; `user_message` starts the timer if a turn begins without a prior `beginTurn`. **Fix:** short queued follow-ups (e.g. `proceed`, 7 chars) no longer overwrite a long reply’s bubble timing or pollute history (`resolveMessageTurnTiming`, `shouldRecordTurnInHistory`).

**Shipped (Partial):** Settings timing history stores **avg + peak** CPU/RAM/GPU per turn (polled while the turn is active on desktop); **Resource columns** select (avg/peak/both). **Output TPS** (running avg + per-turn column when core reports `Tokens:` or cecli `↑↓`); optional **CSV path** + download / write-all / append-after-turn (`write_timing_stats_csv`, up to 300 stored turns). **Turn ETA** (`~Nm left*`) from per-model median/p90 + prompt scale + progress + output TPS; tooltip notes GPU is not an ETA input yet. **Chat clear** (`chat-clear-history`) clears UI then sends **`/clear`** when session is running (queued if busy).

**Open / v2:**

- Burndown chart or trend line in Settings / Tasks.
- Process-scoped utilization (core + Ollama PIDs).
- **GPU surge → ETA** — log GPU alongside turn duration; only blend into ETA after offline correlation on dogfood machines.
- Sync stats across machines (JSON export shipped).
- Input TPS and tokens-sent rate alongside output TPS for bottleneck splits.
- Core SSE fields (`section_started`, `thought_ms`) instead of parser-only.
- Include queued-wait time separately from model “thought” time.

---

## #35 — Context window & file counter

**Problem:** Top-right file count stayed on `sessionInfo` from session start; `/add` via chat never refreshed. No visibility into context growth from added files.

**Shipped (Partial):**

1. **Unified `filesInChat`** — header chip uses `filesInChat` synced with `patchSessionFiles` on every `addFiles` / upload / `GET session` after `done`.
2. **Header chip** — `N files · 12.0k sent` or `N files · ~2.1k added` (`data-testid="session-context-chip"`); **click** opens popover listing `files_in_chat`.
3. **`/add` via chat** — after each `done`, `refreshSessionInfo()` pulls current `files_in_chat` from core.
4. **Add estimate (desktop)** — Tauri `estimate_paths_context_chars` → cumulative `~tokens` in snackbar + tooltip; web relies on `Tokens:` line after turns.

**Open:** Core-reported context % / repo-map size; per-file breakdown; model context limit bar.

---

## #36 — LLM ping

**Problem:** Hard to tell Ollama load vs hung vs core down without starting a full chat turn.

**Shipped (Partial):** **Ping LLM** on Local LLM panel (Terminal + Settings): `GET /api/tags`, `/api/ps`, `POST /api/generate` with `num_predict: 1` (no workspace files), optional `GET {coreApiUrl}/health`. Logs to Terminal; result alert with latency.

**Open:** Ping from header when session stuck; cloud provider ping (non-Ollama); session-level dry-run ping in core.

---

## #38 — Editor rail tab + file tabs + explorer

**Problem:** The **left rail** already switches whole surfaces (Chat, Tasks, Terminal, Git, Settings) via `AppChrome` — easy to miss, but that *is* the primary navigation. There is still no **editor** surface: no file tree, no open-file tabs, no syntax-aware buffer. Charter §5 context work (**#28**, **#32**) relies on `/add` and trays, not “open and edit here.”

**Goal:** Add an **Editor** (or **Files**) entry on the **same left rail** as Chat — not a second tab system that embeds Chat. When that rail tab is active:

1. **Top row (editor mode only)** — MUI tab strip for **open files** (`App.tsx ×`, `foo.ts ×`, …). No Chat tab here; switching back to Chat uses the left rail. Optional diff tab v2.
2. **Center** — Syntax-aware editor (CodeMirror 6) for the active file tab. Dirty indicator; save via Tauri (desktop).
3. **Right column — file explorer** — Pop in/out (chevron or drawer). Tree of workspace files; respect ignore rules for display; git status badges (**#26**, **#27**). Actions: open in top tab, `addFiles`, jump to Git tab.

**Chat unchanged:** `activeTab === 'chat'` continues to show `ChatPanel` full width (plus existing trays/input). Agent work and editor work are separate rail modes; user flips rail icons like today.

**Non-goals (v1):** LSP / IntelliSense, multi-cursor power features, extension marketplace, duplicating Git tab graph in the tree; **no** “pinned Chat” in the editor file tab row.

### Layout sketch

```text
Left rail (always):  Chat | Tasks | Terminal | Git | Editor | Settings
                              ↑ existing pattern (App.tsx NAV)

When rail = Chat:                When rail = Editor:
┌─────────────────────────┐      ┌──────────────────────────────┬──────────┐
│ ChatPanel (as today)    │      │ [ App.tsx × ] [ foo.ts × ]   │ Explorer │
│                         │      ├──────────────────────────────┤  ▾ src/  │
│                         │      │  CodeMirror (active file)    │          │
└─────────────────────────┘      └──────────────────────────────┴──────────┘
```

Explorer width persisted; default **collapsed** on narrow windows.

### Reusable components (evaluate before build)

Prefer **permissive licenses** and **small bundle** ([AGENTS.md](../AGENTS.md)). Spike in a branch before committing.

| Concern | Recommendation | Alternatives / notes |
|--------|----------------|----------------------|
| **Split layout** | [`react-resizable-panels`](https://github.com/bvaughn/react-resizable-panels) — horizontal split for editor \| explorer; persist sizes in `localStorage`. | MUI `Drawer` only (no resize); `allotment` |
| **File tab strip** | **MUI `Tabs`** in **main content**, only when `activeTab === 'editor'`. Closable file tabs; state in React (path, dirty, order). | `react-draggable-tabs` (heavier) |
| **Left rail** | Extend `NAV` in `App.tsx` + `TabId` union — same `AppChrome` pattern as Chat/Git | Second window / route |
| **Syntax editor** | **CodeMirror 6** — `@codemirror/view`, `@codemirror/state`, language packs (`@codemirror/lang-javascript`, `lang-python`, …); wrapper [`@uiw/react-codemirror`](https://github.com/uiwjs/react-codemirror) or thin in-house wrapper. Theme aligned with `src/theme.ts`. | **Monaco** (`@monaco-editor/react`) if we later need LSP — much larger download; defer unless required |
| **File tree** | [`react-arborist`](https://github.com/brimdata/react-arborist) (virtualized, MIT) **or** [`@mui/x-tree-view`](https://mui.com/x/react-tree-view/) + lazy children. Data: Tauri `read_dir` / existing `complete_workspace_path` + `get_tracked_files` / git status map. | Hand-rolled `TreeView`; VS Code webview tree (off-charter) |
| **Explorer chrome** | MUI `IconButton` (collapse), `TextField` (filter), optional `Autocomplete` for quick-open v2 | — |

**Integration points:** `files_in_chat` + `addFiles` from explorer; **#32** “open in editor” from tray; proposed edits (**#2**) as diff tab v2; new `EditorPanel` branch beside `ChatPanel` in `App.tsx` `activeTab` switch.

### Phased delivery

| Phase | Scope |
|-------|--------|
| **v1** | **Done:** Left-rail **Editor** tab; multi file tabs; CM6 + Mod-s save; explorer (toggle + fixed **300px** column); `addFiles` from editor; git badges on tree (**#26**); open in editor from suggested tray, context chip, applied-file chips; dirty tab close confirm. Built-in langs: py/rs/go/js/ts/json/md/yaml/toml/shell/css/html. Dogfood: `yarn tauri dev` at repo root. **2026-05:** dropped `react-resizable-panels` % split (collapsed to icon-only); flex + fixed-width explorer. |
| **v2** | Filter ignore display in explorer; web read-only API; split editor; markdown preview |
| **v3** | **Done:** Allowlisted optional CM6 language packs (`src/editor/languageRegistry.ts` + lazy `loadLanguagePlugin.ts`); Settings → Editor languages toggles; persisted in localStorage; chunks load on first use. Packs: C/C++, Java, PHP, SQL, XML, Vue, Sass, Dockerfile, CMake. Distinct from charter **#29** (Rust/core command plugins). |
| **v4** | Split editor; markdown preview; optional Monaco only if LSP spike wins |

### Dependencies / risks

- **Security:** Sanitize paths; no arbitrary file read outside workspace root (mirror core `Session.add_files` checks).
- **Web (#30):** Explorer may be desktop-first (Tauri FS); web needs read-only or upload-only until a safe read API exists.
- **Bundle:** Measure Vite chunk before/after CM6; lazy-load editor + tree on first open.

**Related:** **#28** (context), **#32** (suggested paths), **#26** (watcher decorations), **#27** (diff tab).

---

## #39 — Local model router

**Problem:** A 27B local model on a “rename this button” prompt can burn 15–20 minutes of inference; swapping to a 7B coder for ~30s plus a ~30s model load is a large net win on unified memory Macs.

**Goal:** Pre-flight each user turn and pick **fast** (fighter pilot) vs **heavy** (engineer) Ollama models.

| Signal | Route |
|--------|--------|
| Live session context + reserve &gt; fast model `max_input_tokens` | Heavy |
| Message tokens ≥ `token_heavy_min` (default 12k) | Heavy |
| Keywords: refactor, race condition, architecture, … | Heavy |
| Keywords: rename, color, typo, … and context &lt; heavy min | Fast |
| Context &lt; `token_fast_max` (4k) and no heavy keywords | Fast (if not a code-task verb) |
| Fast tier, no edits, code-task verbs | Auto-escalate heavy (one retry) |

**Done:** Classify prompts (tokens + keywords); route **heavy** when live context exceeds fast model window (Cecli metadata); **model hopper** in Settings; Tauri `local_llm_prepare_hopper` + `ollama_ensure_model_loaded` (swap unload/load, `load_ms` in UI); auto-escalate + manual **Escalate to heavy**; **Force fast/heavy** in chat; `model_pool` on session create. **May 2026:** route on message tokens (not file-in-chat bump), middle-band `default_fast`, UI fast keywords; long Ollama wait stall hints; silent failed auto-load (`io.drain_events`).

**Longer-term:** 1B classifier model; route timing history in Settings stats.

**Env (desktop):** `local-llm.env` — `MODEL_ROUTER=1`, `FAST_MODEL` / `HEAVY_MODEL` (Ollama tags), synced via Settings → **Sync from env files**; see [LOCAL_LLM.md](./LOCAL_LLM.md#dynamic-model-tiering-39).

**Env (headless):** `BRIGHT_VISION_MODEL_ROUTER=1`, `BRIGHT_VISION_FAST_MODEL=ollama_chat/…`, optional `BRIGHT_VISION_HEAVY_MODEL`.

---

## #40 — cecli agents in Vision

**Problem:** cecli ships **agent mode** and **sub-agents** (`.md` definitions, `AgentService`, `/agent`, `/spawn-agent`, `/invoke-agent`, `Delegate` tool), but Vision only exposes generic slash commands in chat — no agent picker, sub-agent status, or HTTP-first workflows for delegation.

**cecli surface (keep; do not fork):**

| Piece | Role |
|--------|------|
| `/agent <prompt>` | Temporary agent mode on primary coder (`AgentCoder`, tool registry) |
| `subagent_paths` + `*.md` | Registry of named sub-agents (YAML front matter + system prompt) |
| `/invoke-agent <name> <prompt>` | Blocking sub-agent run; summary back to primary |
| `/spawn-agent <name>` | Non-blocking sub-agent; TUI switches via agent pills |
| `/reap-agent` | Force-destroy active sub-agent |
| `Delegate` tool | Primary agent delegates autonomously |

**Shipped (Partial):**

1. **`GET /sessions/{id}/subagents`** — scans `subagent_paths`, returns registry names + prompt preview.
2. **Chat** — **Agents** chip row (`ChatAgentBar`): `/agent`, `/invoke-agent`, `/spawn-agent`, `/reap-agent`; registered sub-agent chips (click → invoke, double-click → spawn).
3. **Settings → Agents & sub-agents** — docs links + loaded registry when session is live.
4. **Commands** — agent slash commands merged into palette with fallback summaries.
5. **Headless guardrails** — `/agent` and other long mode slash preproc: no default cap (`VISION_AGENT_PREPROC_TIMEOUT_S=0`); fast slash still uses `VISION_SLASH_PREPROC_TIMEOUT_S` (300s). `POST /sessions/{id}/interrupt` + SSE disconnect → `interrupt_turn`; default `agent_config` JSON (`command_timeout` 45s).

**Open / v2:**

1. **`POST /sessions/{id}/agents/invoke`** — dedicated invoke without typing slash commands; stream sub-agent SSE.
2. **Header** — active sub-agent pill + reap when stuck (TUI parity).
3. **async_bridge** — graceful cancel (no `Task was destroyed` stderr on Stop).

**Non-goals (v1):** Full TUI agent-pill parity, parallel sub-agent graphs in React, MCP server UI.

**Depends on:** Stable headless session + `async_bridge` teardown (#34 / core lifecycle); dogfood with `agent: true` or `/agent` on real repos.

**Refs:** `BrightVision-core/cecli/helpers/agents/`, `cecli/website/docs/config/agent-mode.md`, `subagents.md`.

---

## Known context

- **Local testing (no CI required):** `yarn dogfood:agent` for self-dev; see [TESTING.md](./TESTING.md), [TESTING_POLICY.md](./TESTING_POLICY.md). Playwright mocks `/api/core` + Tauri `invoke` — primary dogfood is headless ([e2e/ROADMAP_COVERAGE.md](../e2e/ROADMAP_COVERAGE.md)).
- **#19:** Daily dogfood is `yarn dogfood:agent` (see [DOGFOOD.md](./DOGFOOD.md)). **SUBMODULE_VERIFICATION.md** A–D is optional GUI sign-off before release announcements only.
- **#31:** Use [RELEASE.md](./RELEASE.md) when sharing builds; `sh scripts/test-local.sh release` runs the automated release tier.
- **Stuck “Connecting”:** Terminal **Stop** while activity bar shows boot/connect; quit app to clear orphaned `:8741` ([TROUBLESHOOTING.md](./TROUBLESHOOTING.md)). Covered in mocked e2e only.
- **`POST /sessions/{id}/confirm`**: body `{ "confirm_id", "answer": true|false }`.
- **Message queue**: drain on turn end; Stop does not clear queue.
- **`/add` completion**: Tauri desktop only (#12); type path manually on web-only `yarn dev`.
- **Tasks:** `.cecli/todos.json`; workspace API when session + core up; Tauri file mirror when core is down.
- **18d:** Task list uses **manual order** (Up/Down); `depends_on` shows **blocked** chip, not auto-sort.
- **Dogfooding:** [DOGFOOD.md](./DOGFOOD.md), `yarn dogfood:agent`. Friction → failing test or roadmap row: wrong workspace root, proposed vs applied edits, commit in wrong repo, char-split agent todo titles, glued ``{…}{}{…}`` tool JSON (cecli `parse_tool_arguments` / `_expand_concatenated_json`), Grep `tool_footer` TypeError on bad `searches`.
- **Orange `[BrightVision] Task was destroyed…` in chat:** Python asyncio stderr when the core event loop is closed while tasks still wait (common after **Stop** mid-turn or SSE abort during “Waiting for Ollama”; can also appear under heavy Ollama load). Usually harmless noise; recovery = **Stop** → optional **Clear queue** → **Terminal Stop/Start** if still stuck. Manual **`proceed` while a turn is running** is **queued** (bubble appears only when it is actually sent) — it does not preempt the current Ollama wait.

## Suggested fix order

**While dogfooding** (agents run automation; fix what fails; file small roadmap/doc updates when you learn something):

1. **#19 dogfooding** — `yarn dogfood:agent` (add `DOGFOOD_LLM=1` when Ollama is up). Agents use [DOGFOOD.md](./DOGFOOD.md) scenarios via headless API / pytest / integration e2e — not daily `yarn tauri dev`.
2. **Friction from dogfood** — promote to **Open** rows or fix immediately (lifecycle, git tab, context attach, tasks sync).
3. **#28 / #32** (if context picking hurts) — **#32** suggested-files tray + queued `/add`; file-tree / modified-file highlights over **#26** watcher unless git poll is insufficient.
4. **#31** — [RELEASE.md](./RELEASE.md) when sharing builds or pinning submodule for collaborators.
5. **#21–22 v1 → Done** — dogfood on superproject Tasks (Validate EARS, spec index, generate-spec); then **lint on requirements blur**, **re-index after generate-spec** (~2–3 days). **#20** save-triggered spec hooks in parallel.
6. **#29, #30** — Plugins, remaining web parity (longer horizon).
7. **#33** — Resource overlay when local LLM / long runs make CPU/GPU visibility painful (CPU/RAM first; GPU best-effort).
8. **#38** — Editor left-rail tab + file tabs + explorer after core chat/context loop is stable; spike CodeMirror + `react-resizable-panels`; extend `TabId` / `NAV` — do not merge Chat into a top tab row.
9. **#40** — cecli agents/sub-agents in Vision after core loop + asyncio teardown are stable.

## Related docs

- [DEVELOPMENT.md](./DEVELOPMENT.md) — local setup  
- [IPC.md](./IPC.md) — Vision HTTP / SSE events, todos API  
- [SPEC_DRIVEN_DEV.md](./SPEC_DRIVEN_DEV.md) — spec-driven tasks (shipped vs Kiro)  
- [RELEASE.md](./RELEASE.md) — commit/tag checklist  
- [SUBMODULE_VERIFICATION.md](./SUBMODULE_VERIFICATION.md) — superproject + submodule  
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common failures  
- [BUILD_MACOS.md](./BUILD_MACOS.md) — DMG / signing  
- [TESTING.md](./TESTING.md) — local-first: Vitest, Rust, Playwright e2e ([roadmap matrix](../e2e/ROADMAP_COVERAGE.md))  
