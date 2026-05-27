# Spec-driven development & in-app TODOs (roadmap #18)

Goal: lightweight **Kiro-like** flow inside Aider Vision without cloning IDE patterns.

## Shipped (v1–v4a)

| Version | What |
|---------|------|
| v1 | Tasks tab, `.aider-vision/todos.json`, active task, spec inject, `/todo` command |
| v2 | Session todos HTTP API, `active_todo_id`, templates, checklist |
| v3 | Workspace todos HTTP, markdown import/export, checklist auto-complete |
| **v4a** | **Three-layer specs** (requirements / design / implementation tasks), `depends_on`, spec files under `.aider-vision/specs/{id}/`, `spec-driven` template |

### Three-layer model (v4a)

Each task can carry:

| Field | Role |
|-------|------|
| `requirements` | EARS-style requirements (WHEN / THE system SHALL) |
| `design` | Architecture and component design |
| `tasks_md` | Ordered implementation steps (markdown checklist, not the JSON checklist) |
| `checklist` | Runtime acceptance items (auto-complete task when all checked) |
| `depends_on` | Other task IDs that must be `done` before work is unblocked |

Legacy single `spec` is migrated into `requirements` on load when layers are empty.

**Injected chat context** includes all three layers plus checklist and blocker notes for incomplete dependencies.

**On disk:** updates sync to `.aider-vision/specs/<task-id>/requirements.md`, `design.md`, `tasks.md` (JSON remains source of truth in the app).

**Template:** choose `spec-driven` when creating a task for Kiro-style stubs.

## Task git links (shipped)

- `branch` and `pr_url` on each task (markdown `branch:` / `pr:` on export).
- Desktop: **Use current branch** fills from `git_workspace_status`.
- Included in injected spec context when starting work.

## v4b (shipped)

1. **Generate spec** / **Refine spec** — Tasks tab buttons; requires active session + Vision API.  
   `POST /sessions/{id}/todos/{todo_id}/generate-spec` or workspace route with `session_id` query.  
   Body: `{ "prompt", "mode": "generate"|"refine", "apply": true }`.
2. **Steered implementation** — parsed numbered lines in `tasks_md`; **Implement** per step prefills chat.
3. **Dependency order** — task list sorted topologically by `depends_on`.

## v5 (shipped)

- **Background jobs** — `POST …/generate-spec` with `background: true` returns `202` + `job_id`.
- **Ephemeral session** — `dry_run` headless session in a worker thread; chat session unchanged.
- **Poll** — `GET /workspaces/todos/generate-spec/{job_id}` until `completed` or `error`.

## Spec file sync (shipped)

- **To disk** — every todo update writes `.aider-vision/specs/{id}/requirements.md`, `design.md`, `tasks.md`.
- **From disk** — **Reload from disk** (UI) or `POST …/sync-spec-files` / Tauri `import_todo_spec_files`.

## Gap vs Kiro (tracked in ROADMAP #20–22)

| Kiro | Aider Vision today | Roadmap |
|------|-------------------|---------|
| Dedicated spec agent product surface | Ephemeral job + poll | **#20** Open |
| EARS validation & formal spec analysis | Refine prompt only | **#21** Open |
| Sync Files / repo-wide spec index | Per-task JSON + optional spec folder | **#22** Open |

## API

See [IPC.md](./IPC.md) for workspace and session todo routes. Patch body accepts `requirements`, `design`, `tasks_md`, `depends_on`.

## Open questions

- TODOs stay **local-only** (gitignored) by default.
- One **active** task per workspace in the UI.
