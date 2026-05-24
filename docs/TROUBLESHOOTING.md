# Troubleshooting Aider Vision

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
