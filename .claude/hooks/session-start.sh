#!/bin/bash
# SessionStart hook: install what video-use's helpers need before the session starts.
# Claude Code on the web hands us a fresh container each session, so ffmpeg and the
# Python deps from pyproject.toml have to be reinstalled every time.
set -euo pipefail

# Local machines are the user's own setup — don't touch their package manager.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SUDO=""
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
fi

# --- ffmpeg (hard requirement, see install.md) ---------------------------------
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  echo "ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3) already present"
else
  export DEBIAN_FRONTEND=noninteractive
  export DEBCONF_NOWARNINGS=yes

  # Third-party PPAs in this image are blocked by the outbound proxy and make
  # `apt-get update` warn; the Ubuntu archive still refreshes, so don't fail on it.
  $SUDO apt-get update -qq >/dev/null 2>&1 || true
  $SUDO apt-get install -y -qq ffmpeg >/dev/null

  if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
    echo "session-start hook: ffmpeg install failed — video-use helpers will not run" >&2
    exit 1
  fi
  echo "installed ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3)"
fi

# --- Python deps (requests, librosa, matplotlib, pillow, numpy) ----------------
# Install into the ambient interpreter rather than a .venv, so `python3 helpers/x.py`
# works without anyone remembering to activate anything. uv resolves this in seconds;
# plain pip is the fallback when uv is not on the image.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
export PIP_ROOT_USER_ACTION=ignore

if command -v uv >/dev/null 2>&1; then
  uv pip install --system -q -e . || python3 -m pip install -q -e .
else
  python3 -m pip install -q -e .
fi

missing=$(python3 - <<'PY'
import importlib.util
print(" ".join(
    name for mod, name in (
        ("requests", "requests"), ("numpy", "numpy"), ("librosa", "librosa"),
        ("matplotlib", "matplotlib"), ("PIL", "pillow"),
    ) if importlib.util.find_spec(mod) is None
))
PY
)

if [ -n "$missing" ]; then
  echo "session-start hook: Python deps missing after install: $missing" >&2
  exit 1
fi

python3 - <<'PY'
from importlib.metadata import version
print("python deps ready (" + ", ".join(
    f"{p} {version(p)}" for p in ("numpy", "librosa", "matplotlib", "pillow", "requests")
) + ")")
PY
