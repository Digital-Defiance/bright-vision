# Troubleshooting Aider Vision

## Local LLM / Ollama

See **[LOCAL_LLM.md](./LOCAL_LLM.md)** for the full setup (Ollama + built-in Local LLM in the desktop app).

**Quick checks:**

```bash
curl -s http://127.0.0.1:11434/api/tags   # Ollama up?

**Desktop:** Settings or Terminal → Local LLM → **Ping LLM** (1-token generate + core `/health`, no repo edits).
```

- **Settings → LLM model** must use the LiteLLM form `ollama_chat/<tag>` where `<tag>` matches `ollama list` / `DATA_MODEL` in local-llm.
- **Settings → Ollama API base** — leave empty for default; set if Ollama is not on the default host (same URL as `OLLAMA_HOST` in local-llm).
- **Ping: “LLM OK · Core not running”** — Ollama works; start **Terminal → Start** so Vision Core listens on `:8741` ([LOCAL_LLM.md](./LOCAL_LLM.md#ping-status-llm-ok-and-core-not-running)).
- Cloud models: use `openai/…` / `anthropic/…` and set `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in the environment **before** launching the app.

## Stuck on “Sending” / no assistant reply

The header can show **Sending** while the turn timer runs (**Waiting for model** above the chat input). That usually means Vision core is waiting on Ollama, not that the UI is frozen.

1. In a terminal: `ollama ps` — if **UNTIL** is a few minutes (not indefinite), the model will unload and the next turn can hang. Run **Terminal → Local LLM → Start** (preload with `keep_alive: -1`) or **Refresh** (re-applies `-1` without a full restart). For all Ollama clients, you can also set `OLLAMA_KEEP_ALIVE=-1` before starting `ollama serve`.
2. **Chat → `/ps`** — shows `/api/ps` in a table (models in RAM). Use **`/tags`** for pulled models or **`/models`** for both. Does not start a core turn (safe while GPU is busy).
3. **Settings → Ping LLM** — must succeed before chatting.
4. **Stop** the turn, fix Ollama, send again.

**Thinking timer:** **Settings → Thinking timers → Live Response / Think timer** must be on. Timers appear in the **top activity bar** (next to **Sending** / **Thinking**): **Response** from **Send** until done; **Think** for Thinking/Reasoning sections only.

## Answer shown but “Thinking” / queued `/add` never runs

The chat can show a full **Answer** while the header still says **Thinking** or **Waiting for … ollama_chat/…** and **N queued** stays put. That usually means the Vision core HTTP turn never sent `done` (often Ollama unloaded the model — empty `/api/ps` — or the core is still doing repo work).

**False “Turn stalled” at ~90s:** Local turns often take longer. The UI used a 90s SSE idle limit while core progress events were buffered but not streamed. Rebuild **both** the desktop app and restart the core so you get 15-minute SSE limits and ~8s progress pulses on the wire. The orange “likely stuck” hint is advisory only (about 5 minutes without events).

**What to do:**

1. **Settings → Local LLM → Refresh** — check **/api/ps**; if your model is missing, run **Start** or `ollama run <tag>` / **Ping LLM**.
2. **Stop** the current turn, then **Ping LLM**, then retry.
3. Prefer **Add all** on the suggested-files tray (uses the files API and does not wait for the stuck turn). **Queue /add** while a turn is busy now uses the same fast path.
4. If nothing changes for ~90s after the answer appeared, the app aborts the stalled SSE stream and shows an error; use **Clear queue** if you no longer want queued messages.

## Stuck on “Connecting” (desktop)

The activity bar can show **Connecting** to `http://127.0.0.1:8741` while the header says **Stopped** if a **Start** is still in progress or a previous start left the UI in a bad state.

1. Click **Stop** on the Terminal tab — it stays enabled whenever the activity bar shows **Connecting** / **Starting engine** (not only when the session is “live”).
2. Click **Start** again only after Stop finishes; a second Start while connecting will stop the stuck attempt first.
3. If the port is still busy, quit the app fully and reopen it (startup clears orphaned listeners on `:8741`).
4. Check Terminal → technical log for Python/uvicorn errors from `aider-vision-core-serve`.

## `No module named 'aider'`

This is almost always a **stale repo-map cache**, not a missing pip package.

Older runs pickled tag data referencing the pre-rename Python package `aider`. Current code uses `aider_vision_core`.

**Fix:**

```bash
source activate.sh
pip install -e aider-vision-core
rm -rf .aider.tags.cache.v*   # in your project workspace
```

Restart the app. Core v5+ auto-purges legacy cache directories on session start.

## TUI progress / `Scanning repo: 0%|` in chat

The desktop app runs core with `AIDER_VISION_HEADLESS=1`. Terminal tqdm bars must not write to stderr.

If you see progress text in chat:

1. Ensure submodule core is up to date (`pip install -e aider-vision-core`).
2. Restart the API process (quit and reopen the app).
3. Progress should appear in the **header activity bar**, not chat.

## `cecli` submodule points at `bright-vision-core.git`

Parent `.gitmodules` uses **`Digital-Defiance/cecli` only**. A stale submodule checkout may still have `origin` → `bright-vision-core.git` from the old monolithic bundle.

```bash
sh scripts/fix-cecli-submodule-remote.sh
git -C cecli fetch upstream v0.100.1
git -C cecli checkout upstream/v0.100.1
```

See [CECLI_PIN.md](./CECLI_PIN.md).

## `activate.sh`: `command not found: pip` / python not under `.venv`

Usually a **stale `.venv`** from an old checkout path (e.g. `aider-vision`) or macOS `/usr/bin/python3` (3.9) used to create the venv.

```bash
deactivate 2>/dev/null
cd /path/to/BrightVision
source activate.sh   # recreates .venv when activate paths or Python < 3.10
```

Optional: `export BRIGHT_VISION_PYTHON=/opt/homebrew/bin/python3.14` before sourcing if `pick_python` does not find 3.10+.

Set **Settings → Python** to `.venv/bin/python3` or leave blank for auto-detect.

## `uvicorn is required`

```bash
source activate.sh
```

(`activate.sh` installs `uvicorn[standard]`; only run `pip install "uvicorn[standard]"` manually if you skipped activate.)

## Tauri build: `failed to read plugin permissions` under `/Volumes/Code/aider-vision/…`

The `src-tauri/target/` directory has **stale absolute paths** from an old checkout name (`aider-vision`, `bright-vision`). Cargo/Tauri then looks for generated files at a path that no longer exists.

```bash
rm -rf src-tauri/target
cd src-tauri && cargo test
# or: yarn test:rust
```

If it persists, check you are not setting `CARGO_TARGET_DIR` to an old project path.

## `cargo` not found (`yarn build:mac`)

Install Rust so `cargo` is on `PATH` (rustup recommended for universal DMG). See [BUILD_MACOS.md](./BUILD_MACOS.md).

## Compatibility audit (developers)

From the repo root:

```bash
python aider-vision-core/scripts/audit_rename_compat.py
pytest aider-vision-core/tests/basic/test_vision_runtime.py -q
```

Run before releases and after large core merges.
