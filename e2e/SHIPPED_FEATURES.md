# Shipped features → tests

Map every **Done** roadmap slice to automated verification. Add a row when you ship.

| Feature (roadmap) | Mocked e2e | Scenario name | Integration / LLM |
|-------------------|------------|---------------|-------------------|
| Stream / dedupe | `stream-chat.spec.ts` | `cumulative-stream` | — |
| Proposed edits + apply | `proposed-edits-apply.spec.ts` | `proposed-edit` | `edit-block-workspace` disk |
| Chat sections / timers / dismiss | `chat-ux.spec.ts` | `default` | — |
| Stop / queue / multiline | `chat-input.spec.ts` | — | — |
| Confirm | `confirm-flow.spec.ts` | `confirm` | — |
| `/add` Tab | `path-completion.spec.ts` | — | — |
| Attach images | `file-upload.spec.ts` | — | — |
| Settings / commit prefs | `settings-config.spec.ts` | — | — |
| Tasks / generate-spec | `tasks-workspace.spec.ts` | `tasks-seeded` | `integration/tasks-seeded-workspace` |
| Submodule verify | `release-hygiene.spec.ts` | — | `yarn verify:submodule` |
| Git tab (desktop) | `tauri-git.spec.ts` | — | — |
| Git poll | `git-polling.spec.ts` | — | — |
| Context attach | `chat-context.spec.ts` | — | `context-llm` + `context-workspace` |
| Suggested files | `suggested-files.spec.ts` | `suggested-files` | — |
| Thinking timers | `chat-ux.spec.ts` | `default` | — |
| Context chip | `session-context.spec.ts` | `default` | — |
| LLM ping | `local-llm-ping.spec.ts` | — | — |
| Empty LLM + retry | — | `empty-llm` | — |
| Resource overlay | `resource-overlay.spec.ts` | — | — |
| Model router / hopper | `model-router.spec.ts`, `model-hopper.spec.ts` | — | — |
| Agents bar | `agents-bar.spec.ts` | — | — |
| ntf alerts | `ntfy-alerts.spec.ts` | — | — |
| About | `about-dialog.spec.ts` | — | — |
| Editor / languages | `editor-languages.spec.ts` | — | — |
| Session persistence | `session-transcript-hydrate.spec.ts` | `session-transcript` | `test_http_session_persistence.py` |
| Session lifecycle | `session-lifecycle.spec.ts` | `scan-progress` | — |
| Agent todo bridge | — | — | `integration/agent-todo-sync` |
| Navigation | `navigation.spec.ts` | — | — |
| Roadmap gaps UI | `roadmap-gaps.spec.ts` | — | — |

**Run all scenario outputs:** `yarn test:e2e --grep "Scenario:"`

**Full mocked suite:** `yarn test:e2e`
