# BrightVision — feature overview

BrightVision is a **local-LLM-first** desktop IDE (Tauri + React) with a **headless** Python engine (**Cecli** on cecli). This page is the product catalog; tactical status lives in [ROADMAP.md](./ROADMAP.md).

## Shell & navigation

| Area | What you get |
|------|----------------|
| **Left rail** | Chat, Tasks, Terminal, Git, **Editor**, Settings — full-surface tabs, not a VS Code clone |
| **Activity bar** | Live phase (connecting, scanning repo, waiting on model), optional **Response / Think** timers, **~ETA** when history exists |
| **Resource overlay** | CPU / RAM / GPU % in the rail (desktop; system-wide polls) |
| **Session chip** | File count + token context estimate; click for `files_in_chat` list |

## Chat

| Feature | Notes |
|---------|--------|
| **Streaming** | Thinking / Reasoning / Answer sections, section duration chips |
| **Code fences** | Syntax-highlighted blocks + Mermaid diagrams (not plain-text dumps) |
| **Proposed edits** | SEARCH/REPLACE accordions; “applied” labels after `done` |
| **Confirm flow** | Core prompts with Yes/No; auto-approve budget in Settings |
| **Queue & Stop** | Follow-up messages while busy; clear queue from header |
| **Clear history** | Sticky ✕ above transcript; confirms; sends **`/clear`** when session is live |
| **Slash commands** | `/` palette + quick chips; `/add` **Tab** path complete (desktop) |
| **Agents** | `/agent`, `/invoke-agent`, `/spawn-agent`, `/reap-agent` chips; sub-agent registry chips |
| **Attach** | Images/PDF, terminal tail, folder (desktop picker / web path) |
| **Suggested files** | Parses assistant Answer for paths; tray with Add all / **proceed** |
| **Empty LLM** | Local-friendly copy + Retry / Retry with hint |
| **Ollama client cmds** | `/ps`, `/tags`, `/models` — tables in chat (not sent to core) |
| **Model router** | Fast vs heavy tier; escalate offer; force tier chips |
| **Token footer** | Usage line after turns (legacy `Tokens:` + cecli `↑↓`) |

## Tasks & specs (#18)

- `.bright-vision/todos.json` + workspace HTTP API  
- Layered specs (requirements / design / tasks), `depends_on`, templates  
- **Generate / Refine spec**, background jobs  
- **Implement** steered steps with active task chip  

## Git

- Branch, ahead/behind, working tree  
- Stage / commit / undo (desktop Rust git)  
- Commit graph  
- Auto-stage policy after turns (Settings)  

## Editor (#38)

- File tabs + CodeMirror 6  
- Collapsible explorer with git status badges  
- Open from chat / suggested files  
- Optional language packs (Settings)  

## Terminal & engine

- Start / Stop **Cecli** (spawns API on desktop)  
- Technical log (stderr + debug) vs user-facing chat  
- **Local LLM** panel — Ollama tags, load model, ping  
- **Ping LLM** in Settings — 1-token generate + health  

## Settings

- Model, workspace, context files, engine path, appearance fonts  
- Thinking timers + **timing history** (avg/peak CPU/RAM/GPU, TPS, CSV export)  
- Suggested-files prefs (auto-add, auto-proceed)  
- Model hopper / router  
- Resource overlay toggles  
- **Agents** — sub-agent registry + cecli doc links  

## Platform

- **macOS** Homebrew `brightvision`, DMG build docs  
- **Web dev** — Vite proxy to core on `:8741`  
- **Tests** — Vitest, Playwright e2e, core pytest ([TESTING.md](./TESTING.md))  

## What we are not (yet)

- Full TUI sub-agent pills / agent switcher in the header  
- LSP / extension marketplace  
- GPU-driven ETA (logged for research only)  

## Screenshots wanted

To polish the [marketing site](./index.html) and README, useful captures:

1. **Chat** — full turn with Thinking/Answer + proposed edit  
2. **Activity bar** — ETA + Response/Think during a long Ollama turn  
3. **Tasks** — spec-driven task with Implement  
4. **Editor** — tabs + explorer + git badge  
5. **Settings** — timing history table or model hopper  
6. **Agents** — agent chip row + registered sub-agent chips  
7. **Git** — graph + working tree  

Drop PNGs in `assets/` or GitHub attachments and we can wire them into `docs/index.html`.
