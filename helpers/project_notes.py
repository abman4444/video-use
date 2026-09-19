"""Session handoff: the reconnect block at the top of `project.md`.

`project.md` records what was decided. That is not enough to resume — a cold
session also needs to re-establish the environment: where the sources are,
which transcripts are already cached, what was approved, what has already been
delivered. Decisions without that are notes you cannot act on.

So `project.md` has two parts:

  1. A STATE block at the top, rewritten every session, describing the project
     as it is right now and how to reconnect to it.
  2. The session log below it, appended and never rewritten.

This script owns part 1 and never touches part 2.

    --verify   (default) read-only. Re-scan the project and check that
               everything `edl.json` and `assets.json` point at still exists
               and that the tooling a resume needs is available. Run it on
               cold start, BEFORE trusting anything the notes claim.
    --refresh  rewrite the state block from the current scan, preserving the
               log below it. Run it at the end of a session.

Verify is deliberately not a markdown parser — it re-derives the truth from
disk and the project's own JSON, so prose that has drifted cannot fool it.

Usage:
    python helpers/project_notes.py <edit_dir>
    python helpers/project_notes.py <edit_dir> --refresh
    python helpers/project_notes.py <edit_dir> --refresh --title "Launch video"
    python helpers/project_notes.py <edit_dir> --json
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".m4v", ".avi", ".mts", ".m2ts"}

STATE_OPEN = "<!-- project-notes:state -->"
STATE_CLOSE = "<!-- /project-notes:state -->"

# Outputs live directly in the edit dir; these are builds, not sources.
BUILD_NAMES = {"base.mp4"}


# -------- Scan ---------------------------------------------------------------


def ffprobe_duration(path: Path) -> float | None:
    if not shutil.which("ffprobe"):
        return None
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
           "-of", "default=nw=1:nk=1", str(path)]
    try:
        out = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip()
        return float(out)
    except Exception:
        return None


def fmt_dur(seconds: float | None) -> str:
    if seconds is None:
        return "?"
    m, s = divmod(int(round(seconds)), 60)
    return f"{m}m {s:02d}s" if m else f"{s}s"


def load_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def resolve_ref(ref: str, edit_dir: Path) -> Path:
    p = Path(ref)
    if p.is_absolute():
        return p
    for root in (edit_dir, edit_dir.parent):
        cand = root / p
        if cand.exists():
            return cand
    return edit_dir / p


def api_key_present(skill_dir: Path) -> bool:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return True
    env = skill_dir / ".env"
    if env.exists():
        try:
            return "ELEVENLABS_API_KEY" in env.read_text()
        except Exception:
            return False
    return False


def scan(edit_dir: Path, skill_dir: Path) -> dict:
    sources_dir = edit_dir.parent
    tx_dir = edit_dir / "transcripts"

    sources = []
    for f in sorted(sources_dir.iterdir()):
        if not f.is_file() or f.suffix.lower() not in VIDEO_EXTS:
            continue
        sources.append({
            "name": f.name,
            "path": str(f),
            "duration_s": ffprobe_duration(f),
            "transcript": (tx_dir / f"{f.stem}.json").exists(),
        })

    outputs = []
    if edit_dir.exists():
        for f in sorted(edit_dir.iterdir()):
            if f.is_file() and f.suffix.lower() in VIDEO_EXTS and f.name not in BUILD_NAMES:
                outputs.append({"name": f.name, "duration_s": ffprobe_duration(f)})

    edl = load_json(edit_dir / "edl.json")
    manifest = load_json(edit_dir / "assets.json")

    return {
        "sources_dir": str(sources_dir),
        "edit_dir": str(edit_dir),
        "sources": sources,
        "outputs": outputs,
        "edl": edl,
        "manifest": manifest,
        "tooling": {
            "ffmpeg": bool(shutil.which("ffmpeg")),
            "ffprobe": bool(shutil.which("ffprobe")),
            "elevenlabs_api_key": api_key_present(skill_dir),
        },
    }


# -------- Verify -------------------------------------------------------------


def verify(state: dict, edit_dir: Path) -> tuple[list[str], list[str], list[str]]:
    """Returns (blockers, warnings, info)."""
    blockers: list[str] = []
    warnings: list[str] = []
    info: list[str] = []

    tool = state["tooling"]
    for name in ("ffmpeg", "ffprobe"):
        if not tool[name]:
            blockers.append(f"{name} not on PATH — nothing can render. See install.md.")

    sources = state["sources"]
    untranscribed = [s["name"] for s in sources if not s["transcript"]]
    if not sources:
        warnings.append(f"no source video files in {state['sources_dir']}")
    else:
        cached = len(sources) - len(untranscribed)
        info.append(f"{len(sources)} source file(s), {cached} with cached transcripts")
    if untranscribed:
        warnings.append(
            f"{len(untranscribed)} source(s) have no cached transcript "
            f"({', '.join(untranscribed[:4])}{'…' if len(untranscribed) > 4 else ''}) — "
            f"new footage, or the cache was cleared")
        if not tool["elevenlabs_api_key"]:
            blockers.append(
                "ELEVENLABS_API_KEY does not resolve and there is footage left to "
                "transcribe — ask the user for a key before proceeding")
    elif not tool["elevenlabs_api_key"]:
        info.append("no ELEVENLABS_API_KEY, but every source is already cached — fine "
                    "unless new footage arrives")

    edl = state["edl"]
    if edl is None:
        info.append("no edl.json yet — this project has not been cut")
    else:
        missing = [name for name, ref in (edl.get("sources") or {}).items()
                   if not resolve_ref(str(ref), edit_dir).exists()]
        if missing:
            blockers.append(
                f"edl.json references {len(missing)} source(s) that no longer exist "
                f"({', '.join(missing[:4])}) — the sources moved or were renamed")
        missing_ov = [str(ov.get("file")) for ov in (edl.get("overlays") or [])
                      if not resolve_ref(str(ov.get("file", "")), edit_dir).exists()]
        if missing_ov:
            blockers.append(
                f"edl.json references {len(missing_ov)} overlay render(s) that are gone "
                f"({', '.join(missing_ov[:3])}) — rebuild the slot or drop the overlay")
        subs = edl.get("subtitles")
        if subs and not resolve_ref(str(subs), edit_dir).exists():
            warnings.append(f"edl.json points at a missing subtitle file ({subs})")
        info.append(f"edl.json: {len(edl.get('ranges') or [])} range(s), "
                    f"{len(edl.get('overlays') or [])} overlay(s), "
                    f"{fmt_dur(edl.get('total_duration_s'))}")

    manifest = state["manifest"]
    if manifest is None:
        if edl and (edl.get("overlays") or []):
            warnings.append("overlays in the edit but no assets.json — the approved asset "
                            "plan is missing. See the Asset manifest section of SKILL.md.")
    else:
        if not manifest.get("approved"):
            warnings.append("assets.json has no `approved` value — the asset plan was never "
                            "signed off")
        missing_a = [a.get("id") or a.get("file") for a in (manifest.get("assets") or [])
                     if a.get("file") and not resolve_ref(str(a["file"]), edit_dir).exists()]
        if missing_a:
            blockers.append(
                f"assets.json lists {len(missing_a)} asset(s) whose render is gone "
                f"({', '.join(str(m) for m in missing_a[:3])})")
        info.append(f"assets.json: {len(manifest.get('assets') or [])} asset(s), "
                    f"approved {manifest.get('approved') or 'NOT YET'}")

    if state["outputs"]:
        info.append(f"{len(state['outputs'])} rendered output(s): "
                    f"{', '.join(o['name'] for o in state['outputs'][:5])}")

    return blockers, warnings, info


# -------- Render the state block --------------------------------------------


def render_state_block(state: dict, title: str | None, edit_dir: Path) -> str:
    sources = state["sources"]
    total = sum(s["duration_s"] or 0.0 for s in sources)
    edl = state["edl"]
    manifest = state["manifest"]

    lines = [STATE_OPEN, ""]
    lines.append(f"# Project notes — {title or Path(state['sources_dir']).name}")
    lines.append("")
    lines.append(f"**Updated:** {date.today().isoformat()}")
    lines.append(f"**Sources:** `{state['sources_dir']}` — {len(sources)} file(s), "
                 f"{fmt_dur(total)} total")
    lines.append(f"**Edit dir:** `{state['edit_dir']}`")
    if edl:
        lines.append(f"**Cut:** {len(edl.get('ranges') or [])} ranges, "
                     f"{fmt_dur(edl.get('total_duration_s'))}, grade "
                     f"`{edl.get('grade') or 'none'}`")
    lines.append("")

    lines.append("## Reconnect")
    lines.append("")
    lines.append("Run this before trusting anything below:")
    lines.append("")
    lines.append("```bash")
    lines.append(f"python helpers/project_notes.py {state['edit_dir']}")
    lines.append("```")
    lines.append("")
    steps = [f"Sources live in `{state['sources_dir']}` — confirm they are still there.",
             "Transcripts are cached in `transcripts/` — **never re-transcribe** a source "
             "whose file has not changed."]
    if manifest:
        steps.append("Read `assets.json` for the approved visual concept before touching any "
                     "animation. Copy its `concept` values verbatim into every sub-agent brief.")
    if edl:
        steps.append("`edl.json` holds the cut decisions. Revisions edit it; they do not "
                     "start over.")
    if state["outputs"]:
        steps.append("Existing renders are listed under Deliverables — **never overwrite a "
                     "variant**, add a new one.")
    for i, step in enumerate(steps, start=1):
        lines.append(f"{i}. {step}")
    lines.append("")

    if sources:
        lines.append("## Sources")
        lines.append("")
        lines.append("| file | duration | transcript |")
        lines.append("|---|---|---|")
        for s in sources:
            lines.append(f"| `{s['name']}` | {fmt_dur(s['duration_s'])} | "
                         f"{'cached' if s['transcript'] else '**missing**'} |")
        lines.append("")

    lines.append("## Artifacts")
    lines.append("")
    lines.append("| file | state |")
    lines.append("|---|---|")
    edl_state = (f"{len(edl.get('ranges') or [])} ranges, "
                 f"{len(edl.get('overlays') or [])} overlays" if edl else "not created")
    lines.append(f"| `edl.json` | {edl_state} |")
    man_state = (f"{len(manifest.get('assets') or [])} assets, approved "
                 f"{manifest.get('approved') or '**NOT YET**'}" if manifest else "not created")
    lines.append(f"| `assets.json` | {man_state} |")
    lines.append("")

    if state["outputs"]:
        lines.append("## Deliverables")
        lines.append("")
        for o in state["outputs"]:
            lines.append(f"- `{o['name']}` — {fmt_dur(o['duration_s'])}")
        lines.append("")

    lines.append(STATE_CLOSE)
    return "\n".join(lines)


LOG_HEADER = "## Session log"

LOG_TEMPLATE = f"""
{LOG_HEADER}

Appended one section per session, oldest first. Never rewritten.

<!-- Template:
## Session N — YYYY-MM-DD

**Strategy:** one paragraph describing the approach
**Decisions:** take choices, cuts, grades, animations + why
**Reasoning log:** one-line rationale for non-obvious decisions
**Outstanding:** deferred items
-->
"""


def refresh(notes_path: Path, block: str) -> str:
    """Replace the state block, preserve everything below it."""
    if not notes_path.exists():
        return block + "\n" + LOG_TEMPLATE

    existing = notes_path.read_text()
    if STATE_OPEN in existing and STATE_CLOSE in existing:
        head, rest = existing.split(STATE_OPEN, 1)
        _, tail = rest.split(STATE_CLOSE, 1)
        return head + block + tail

    # Pre-existing hand-written notes: keep every word, put them under the log.
    body = existing.strip()
    if LOG_HEADER in body:
        return block + "\n\n" + body + "\n"
    return block + "\n" + LOG_TEMPLATE + "\n" + body + "\n"


# -------- Main ---------------------------------------------------------------


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edit_dir", type=Path, help="the <videos_dir>/edit directory")
    ap.add_argument("--refresh", action="store_true",
                    help="rewrite the state block (default is read-only verify)")
    ap.add_argument("--title", default=None, help="project title for the notes header")
    ap.add_argument("--json", action="store_true", help="emit the raw scan as JSON")
    args = ap.parse_args()

    edit_dir = args.edit_dir.resolve()
    if not edit_dir.exists():
        print(f"{edit_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    skill_dir = Path(__file__).resolve().parent.parent
    state = scan(edit_dir, skill_dir)

    if args.json:
        print(json.dumps(state, indent=2, default=str))
        return

    notes_path = edit_dir / "project.md"

    if args.refresh:
        block = render_state_block(state, args.title, edit_dir)
        notes_path.write_text(refresh(notes_path, block))
        print(f"Refreshed the state block in {notes_path}")
        print("The session log below it is untouched — append this session's entry by hand.")
        return

    blockers, warnings, info = verify(state, edit_dir)

    print(f"Project: {state['sources_dir']}")
    for line in info:
        print(f"  {line}")
    if not notes_path.exists():
        warnings.append("no project.md — run with --refresh to create one")

    if warnings:
        print()
        for w in warnings:
            print(f"  ~ {w}")
    if blockers:
        print()
        print(f"{len(blockers)} blocker(s) — resolve before resuming:")
        for b in blockers:
            print(f"  ! {b}")
        sys.exit(1)

    print()
    print("Environment re-established. Read project.md for what was decided, then "
          "summarize the last session in one sentence before asking how to continue.")


if __name__ == "__main__":
    main()
