#!/usr/bin/env sh
# Fix cecli submodule remotes after legacy BrightVision-core bundle clone.
# Parent .gitmodules URL: https://github.com/Digital-Defiance/cecli.git
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CECLI="${ROOT}/cecli"
if [ ! -d "${CECLI}/.git" ]; then
  echo "Missing cecli submodule — run: git submodule update --init cecli" >&2
  exit 1
fi
git submodule sync cecli
git -C "$CECLI" remote set-url origin https://github.com/Digital-Defiance/cecli.git
if git -C "$CECLI" remote | grep -qx upstream; then
  git -C "$CECLI" remote set-url upstream https://github.com/cecli-dev/cecli.git
else
  git -C "$CECLI" remote add upstream https://github.com/cecli-dev/cecli.git
fi
echo "cecli remotes:"
git -C "$CECLI" remote -v
