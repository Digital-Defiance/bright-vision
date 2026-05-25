# Release checklist (Bright Vision + core submodule)

Use this when cutting a release that includes Tasks / spec-driven work (roadmap #18) and Vision HTTP API changes.

## 1. Core submodule (`bright-vision-core`)

```bash
cd bright-vision-core
git status   # ensure workspace_todos, http_api, session, tests are included
git add -A
git commit -m "$(cat <<'EOF'
feat(vision): todos API, spec layers, cecli session bridge

Three-layer specs, workspace/session todo routes, RepoSet superproject
support, and headless HTTP API on cecli.
EOF
)"
git tag -a v0.1.0-bright -m "Bright Vision Core: cecli + headless API"
git push origin main --tags   # when ready
```

## 2. Pin parent app

```bash
cd ..
git add bright-vision-core   # submodule pointer at tag
# commit parent app UI + docs + Tauri
```

Legacy `aider-vision-core` sync script (pre-cecli) remains only if you still ship the old engine:

```bash
cd aider-vision-core && ./scripts/sync_aider_vision.sh <version> --commit
```

## 3. Verify

```bash
source activate.sh
yarn verify:submodule
yarn test:full         # local: tsc + vitest + rust + e2e (see TESTING.md)
# or: sh scripts/test-local.sh release   # adds verify:submodule when .venv exists
yarn test:bright-core
yarn tauri dev   # smoke: Terminal Start/Stop, Tasks tab, Generate spec, Git tab
```

## 4. Optional

- `yarn build:mac` — see [BUILD_MACOS.md](./BUILD_MACOS.md)
- Bump `package.json` / `tauri.conf.json` version if shipping a desktop build
- `BRIGHT_VISION_ENGINE=aider-vision-core` — legacy fallback until submodule deinit
