#!/usr/bin/env bash
#
# Open Remotion Studio for an animation slot — reliably, in one command.
#
# Scaffolds a project-local Remotion slot if one isn't there yet, picks a port
# that's actually free, and launches the Studio dev server. Keeps the Remotion
# project isolated inside the slot directory (SKILL.md "Animations"), never at
# the video-use repo root.
#
# Usage:
#     helpers/remotion_studio.sh                              # slot: ./edit/animations/slot_01
#     helpers/remotion_studio.sh edit/animations/slot_03      # explicit slot
#     helpers/remotion_studio.sh <slot> --port 3333           # pin a port
#     helpers/remotion_studio.sh <slot> --check               # prereqs + scaffold, don't launch
#     helpers/remotion_studio.sh <slot> --no-open             # don't auto-open the browser
#
# Studio is a live server: it only works while this command is running.
# Ctrl-C ends the session and the browser tab goes dead.

set -euo pipefail

G="\033[0;32m"; R="\033[0;31m"; Y="\033[0;33m"; B="\033[1m"; N="\033[0m"
ok()   { echo -e "  ${G}+${N} $1"; }
warn() { echo -e "  ${Y}!${N} $1"; }
fail() { echo -e "  ${R}x${N} $1"; }
die()  { fail "$1"; exit 1; }

SLOT="edit/animations/slot_01"
PORT=""
CHECK_ONLY=0
OPEN_BROWSER=1

while [ $# -gt 0 ]; do
    case "$1" in
        --port)     PORT="${2:-}"
                    case "$PORT" in
                        ''|*[!0-9]*) die "--port needs a number, got: '${PORT}'" ;;
                    esac
                    shift 2 ;;
        --check)    CHECK_ONLY=1; shift ;;
        --no-open)  OPEN_BROWSER=0; shift ;;
        -h|--help)  awk 'NR>1 && /^#/ {sub(/^# ?/, ""); print; next} NR>1 {exit}' "$0"; exit 0 ;;
        -*)         die "unknown flag: $1" ;;
        *)          SLOT="$1"; shift ;;
    esac
done

echo ""
echo -e "${B}Remotion Studio — video-use${N}"
echo ""

# ---------------------------------------------------------------- prerequisites

command -v node >/dev/null || die "Node.js not found. macOS: brew install node@22"
command -v npm  >/dev/null || die "npm not found. It ships with Node.js — reinstall Node."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node $(node -v) is too old. Remotion needs 18+. macOS: brew install node@22"
ok "Node $(node -v)"
ok "npm v$(npm -v)"

# Remotion bundles its own ffmpeg for rendering; the rest of video-use does not.
if command -v ffmpeg >/dev/null; then
    ok "ffmpeg ($(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}'))"
else
    warn "ffmpeg not on PATH — Studio is fine, but helpers/render.py needs it (brew install ffmpeg)"
fi

# Studio serves on localhost. If this shell isn't on the machine holding the
# browser, that localhost URL points here, not at the user's laptop.
IS_REMOTE=0
if [ -n "${SSH_CONNECTION:-}" ]; then
    IS_REMOTE=1
elif [ "$(uname -s)" != "Darwin" ] && [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
    IS_REMOTE=1
fi
if [ "$IS_REMOTE" -eq 1 ]; then
    warn "This looks like a remote/headless shell."
    warn "The localhost URL below points at THIS machine, not at your laptop."
    warn "To use Studio, run this script in a terminal on your own Mac."
    OPEN_BROWSER=0
fi

# ---------------------------------------------------------------- scaffold slot

mkdir -p "$SLOT"
SLOT_ABS="$(cd "$SLOT" && pwd)"

if [ -f "$SLOT_ABS/package.json" ] && grep -q '"remotion"' "$SLOT_ABS/package.json"; then
    ok "Remotion slot exists at $SLOT"
else
    echo ""
    echo -e "${B}Scaffolding a Remotion slot at $SLOT${N}"

    cat > "$SLOT_ABS/package.json" <<'EOF'
{
  "name": "remotion-slot",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "remotion studio",
    "render": "remotion render Slate render.mp4"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "typescript": "^5.6.3"
  }
}
EOF

    cat > "$SLOT_ABS/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "remotion.config.ts"]
}
EOF

    cat > "$SLOT_ABS/remotion.config.ts" <<'EOF'
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
EOF

    mkdir -p "$SLOT_ABS/src"

    cat > "$SLOT_ABS/src/index.ts" <<'EOF'
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';

registerRoot(RemotionRoot);
EOF

    cat > "$SLOT_ABS/src/Root.tsx" <<'EOF'
import {Composition} from 'remotion';
import {Slate} from './Composition';

export const RemotionRoot = () => {
  return (
    <Composition
      id="Slate"
      component={Slate}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: 'video-use',
        subtitle: 'edit src/Composition.tsx — Studio hot-reloads',
      }}
    />
  );
};
EOF

    # Palette and type here are a neutral placeholder on purpose. SKILL.md says
    # to take palette, font and visual language from the conversation.
    cat > "$SLOT_ABS/src/Composition.tsx" <<'EOF'
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type SlateProps = {
  title: string;
  subtitle: string;
};

export const Slate = ({title, subtitle}: SlateProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rise = spring({frame, fps, config: {damping: 200}});
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b0b0f',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${interpolate(rise, [0, 1], [40, 0])}px)`,
          textAlign: 'center',
        }}
      >
        <div style={{color: '#ffffff', fontSize: 110, fontWeight: 700}}>
          {title}
        </div>
        <div style={{color: '#8b8b96', fontSize: 34, marginTop: 24}}>
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
EOF

    ok "wrote package.json, tsconfig.json, remotion.config.ts, src/"
fi

if [ ! -d "$SLOT_ABS/node_modules" ]; then
    echo ""
    echo -e "${B}Installing Remotion into the slot (first run only, ~1-2 min)${N}"
    ( cd "$SLOT_ABS" && npm install --no-audit --no-fund )
    ok "dependencies installed"
else
    ok "dependencies already installed"
fi

# ---------------------------------------------------------------- pick a port

# Remotion silently walks up from 3000 when a port is busy, which is how people
# end up pasting a dead URL. Resolve it here and print the real one.
find_free_port() {
    node -e '
      const net = require("net");
      const start = parseInt(process.argv[1], 10);
      const max = start + 50;
      const attempt = (port) => {
        if (port > max) { process.exit(1); }
        const server = net.createServer();
        server.once("error", () => attempt(port + 1));
        server.once("listening", () => server.close(() => {
          process.stdout.write(String(port));
        }));
        server.listen(port, "127.0.0.1");
      };
      attempt(start);
    ' "$1"
}

if [ -n "$PORT" ]; then
    RESOLVED="$(find_free_port "$PORT" || true)"
    [ "$RESOLVED" = "$PORT" ] || die "port $PORT is busy. Free it, or drop --port to auto-pick."
else
    RESOLVED="$(find_free_port 3000 || true)"
    [ -n "$RESOLVED" ] || die "no free port in 3000-3050."
fi

if [ "$CHECK_ONLY" -eq 1 ]; then
    echo ""
    ok "slot ready at $SLOT — port $RESOLVED is free"
    echo ""
    exit 0
fi

# ---------------------------------------------------------------- launch

URL="http://localhost:$RESOLVED"
echo ""
echo -e "${B}Starting Studio${N}"
echo -e "  URL:  ${B}$URL${N}   (include the http:// — Chrome searches bare 'localhost:3000')"
echo -e "  Slot: $SLOT"
echo -e "  ${Y}Leave this terminal running.${N} Ctrl-C stops Studio and the tab goes dead."
echo ""

cd "$SLOT_ABS"
ARGS=(remotion studio src/index.ts --port "$RESOLVED")
[ "$OPEN_BROWSER" -eq 1 ] || ARGS+=(--no-open)
exec npx "${ARGS[@]}"
