#!/bin/bash
# SessionStart hook: make sure ffmpeg/ffprobe exist before the session starts.
# video-use treats them as hard requirements (see install.md), and Claude Code on
# the web hands us a fresh container each session, so they have to be reinstalled.
set -euo pipefail

# Local machines are the user's own setup — don't touch their package manager.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  echo "ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3) already present"
  exit 0
fi

SUDO=""
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
fi

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
