#!/usr/bin/env sh
# Playwright webServer: E2E build + vite preview on 4173.
# Frees the port first so a stale preview does not make yarn test:e2e fail.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${E2E_PREVIEW_PORT:-4173}"
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti "tcp:${PORT}" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "e2e-preview: freeing port ${PORT} (stale process)" >&2
    # shellcheck disable=SC2086
    kill -9 $PIDS 2>/dev/null || true
    sleep 0.3
  fi
fi
export E2E=1
yarn build
exec yarn vite preview --host 127.0.0.1 --port "$PORT"
