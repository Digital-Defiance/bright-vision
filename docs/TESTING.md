# Testing

## Unit tests (Vitest)

Pure TypeScript helpers and policies (chat sections, commit graph layout, auto-stage rules, git labels):

```bash
yarn test
yarn test --watch   # if you add a watch script
```

## Rust git commands

Tauri `git_ops` module (commit graph parse + temp-repo integration):

```bash
yarn test:rust
# or: cd src-tauri && cargo test
```

## End-to-end (Playwright, web build)

Smoke tests run the Vite **preview** build in a browser (no Tauri). Git invoke APIs are not available; the Git tab asserts the desktop-only hint.

First-time setup:

```bash
yarn install
npx playwright install chromium
```

Run:

```bash
yarn test:e2e
```

## Full check (before PR)

```bash
yarn tsc --noEmit
yarn test
yarn test:rust
yarn test:e2e
yarn verify:submodule   # when core venv is present
```

## Core Python

```bash
yarn test:git-workspace
cd aider-vision-core && python -m pytest tests/ -q
```
