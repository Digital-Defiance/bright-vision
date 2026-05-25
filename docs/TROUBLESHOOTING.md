# Troubleshooting Aider Vision

## Local LLM / Ollama

See **[LOCAL_LLM.md](./LOCAL_LLM.md)** for the full setup (Ollama + [local-llm](https://github.com/Digital-Defiance/local-llm)).

**Quick checks:**

```bash
curl -s http://127.0.0.1:11434/api/tags   # Ollama up?

**Desktop:** Settings or Terminal → Local LLM → **Ping LLM** (1-token generate + core `/health`, no repo edits).
```

- **Settings → LLM model** must use the LiteLLM form `ollama_chat/<tag>` where `<tag>` matches `ollama list` / `DATA_MODEL` in local-llm.
- **Settings → Ollama API base** — leave empty for default; set if Ollama is not on the default host (same URL as `OLLAMA_HOST` in local-llm).
- Cloud models: use `openai/…` / `anthropic/…` and set `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in the environment **before** launching the app.

## Answer shown but “Thinking” / queued `/add` never runs

The chat can show a full **Answer** while the header still says **Thinking** or **Waiting for … ollama_chat/…** and **N queued** stays put. That usually means the Vision core HTTP turn never sent `done` (often Ollama unloaded the model — empty `/api/ps` — or the core is still doing repo work).

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

## `uvicorn is required`

```bash
source activate.sh
pip install "uvicorn[standard]"
```

Set **Settings → Python** to `.venv/bin/python3` or leave blank for auto-detect.

## `cargo` not found (`yarn build:mac`)

Install Rust so `cargo` is on `PATH` (rustup recommended for universal DMG). See [BUILD_MACOS.md](./BUILD_MACOS.md).

## Compatibility audit (developers)

From the repo root:

```bash
python aider-vision-core/scripts/audit_rename_compat.py
pytest aider-vision-core/tests/basic/test_vision_runtime.py -q
```

Run before releases and after large core merges.
