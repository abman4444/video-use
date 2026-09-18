"""Asset gate: check every overlay IN ITS REAL CONTEXT before the full render.

An overlay can render beautifully on its own and still be wrong in the edit —
illegible over the footage it actually lands on, colliding with the subtitle
band, or the wrong duration for its window. Finding that out at the self-eval
step means you already paid for a full composite.

This is the cheap gate that runs BEFORE assembly. For each overlay in the EDL
it walks the output timeline to find which source frame is live under the
overlay window, composites the overlay's own frames on top the same way
`render.py` does (native size, anchored 0,0), draws the subtitle safe band,
and writes one contact sheet per overlay to `<edit>/verify/`.

It never renders the base or the final — it pulls single frames straight from
the sources, so it stays fast no matter how long the timeline is.

Also reports hard spec mismatches as text: overlay duration vs the window the
EDL declares for it, overlay resolution vs the render target, and any window
that runs off the end of the timeline.

If an `assets.json` manifest sits next to the EDL it is used as the source of
truth. The manifest is the asset plan the user approved BEFORE anything was
generated — count, kind, spec and the composition constraint each asset has to
satisfy — so the gate can check what was delivered against what was agreed,
not just against the EDL. It catches assets that were planned and never used,
overlays that entered the edit without ever being approved, generated assets
with no headroom to cut into, and generation that ran before the plan was
signed off. See `references/assets-and-assembly.md`.

Usage:
    python helpers/asset_check.py <edl.json>
    python helpers/asset_check.py <edl.json> --slot 2
    python helpers/asset_check.py <edl.json> --n-frames 6 --width 1920
    python helpers/asset_check.py <edl.json> --manifest /path/to/assets.json
    python helpers/asset_check.py <edl.json> --no-manifest
    python helpers/asset_check.py <edl.json> --scaffold   # migration aid only
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


# -------- Shared look with timeline_view.py ----------------------------------

FONT_CANDIDATES = [
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/SFNSMono.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
]

BG = (18, 18, 22)
FG = (235, 235, 235)
DIM = (110, 110, 120)
ACCENT = (255, 140, 60)
WARN = (255, 90, 0)
OK = (120, 200, 130)

# render.py: MarginV=90 against libass PlayResY=288 puts the caption baseline
# ~30% up from the bottom. Band drawn from 24%–34% of frame height.
SUB_BAND = (0.66, 0.76)


def load_font(size: int) -> ImageFont.ImageFont:
    for fp in FONT_CANDIDATES:
        if Path(fp).exists():
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


# -------- EDL plumbing -------------------------------------------------------


def resolve_path(maybe_path: str, base: Path) -> Path:
    """EDL paths are absolute, or relative to the edit dir (or its parent)."""
    p = Path(maybe_path)
    if p.is_absolute():
        return p
    for root in (base, base.parent):
        cand = root / p
        if cand.exists():
            return cand
    return base / p


def build_output_map(edl: dict, edit_dir: Path) -> list[tuple[float, float, Path, float]]:
    """Flatten `ranges` into the output timeline.

    Returns [(out_start, out_end, source_path, source_start), ...] so an output
    time can be mapped back to the exact source frame that will be live there.
    This is the same offset walk `render.py` uses to build the master SRT.
    """
    sources = edl.get("sources") or {}
    spans: list[tuple[float, float, Path, float]] = []
    cursor = 0.0
    for r in edl.get("ranges") or []:
        start = float(r["start"])
        end = float(r["end"])
        dur = max(0.0, end - start)
        src = sources.get(r["source"], r["source"])
        spans.append((cursor, cursor + dur, resolve_path(str(src), edit_dir), start))
        cursor += dur
    return spans


def source_frame_for(spans, t: float):
    """Map an output timestamp to (source_path, source_time). None if off the end."""
    for out_start, out_end, src, src_start in spans:
        if out_start <= t < out_end:
            return src, src_start + (t - out_start)
    if spans and t >= spans[-1][1]:
        return None
    return None


# -------- ffprobe / ffmpeg ---------------------------------------------------


def probe(path: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate:format=duration",
        "-of", "json", str(path),
    ]
    out = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout
    data = json.loads(out)
    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}
    rate = stream.get("r_frame_rate") or "0/1"
    try:
        num, den = rate.split("/")
        fps = float(num) / float(den) if float(den) else 0.0
    except Exception:
        fps = 0.0
    return {
        "width": int(stream.get("width") or 0),
        "height": int(stream.get("height") or 0),
        "fps": fps,
        "duration": float(fmt.get("duration") or 0.0),
    }


def grab_frame(video: Path, t: float, dest: Path, width: int | None = None) -> Path | None:
    """Single frame at `t` as PNG (keeps alpha for webm overlays)."""
    vf = f"scale={width}:-2" if width else None
    cmd = ["ffmpeg", "-y", "-ss", f"{max(0.0, t):.3f}", "-i", str(video), "-frames:v", "1"]
    if vf:
        cmd += ["-vf", vf]
    cmd += [str(dest)]
    r = subprocess.run(cmd, capture_output=True)
    return dest if r.returncode == 0 and dest.exists() else None


# -------- Contact sheet ------------------------------------------------------


def compose_cell(base_img: Image.Image, ov_img: Image.Image | None) -> Image.Image:
    """Mirror render.py's composite: overlay at native size, anchored 0,0."""
    cell = base_img.convert("RGB")
    if ov_img is None:
        return cell
    ov = ov_img.convert("RGBA")
    cell.paste(ov, (0, 0), ov)
    return cell


def draw_sub_band(img: Image.Image, font: ImageFont.ImageFont) -> None:
    w, h = img.size
    top = int(h * SUB_BAND[0])
    bottom = int(h * SUB_BAND[1])
    band = Image.new("RGBA", (w, bottom - top), (255, 90, 0, 40))
    img.paste(Image.alpha_composite(
        img.crop((0, top, w, bottom)).convert("RGBA"), band).convert("RGB"), (0, top))
    d = ImageDraw.Draw(img)
    d.line([(0, top), (w, top)], fill=WARN, width=2)
    d.line([(0, bottom), (w, bottom)], fill=WARN, width=2)
    d.text((8, top + 4), "SUBTITLE BAND", fill=WARN, font=font)


def build_sheet(
    slot_label: str,
    window: tuple[float, float],
    cells: list[tuple[float, Image.Image]],
    notes: list[tuple[str, tuple[int, int, int]]],
    out_path: Path,
    cell_width: int = 480,
) -> None:
    font = load_font(13)
    small = load_font(11)
    title_font = load_font(16)

    scaled: list[tuple[float, Image.Image]] = []
    for t, img in cells:
        ratio = cell_width / img.width
        scaled.append((t, img.resize((cell_width, max(1, int(img.height * ratio))))))

    cols = min(3, len(scaled)) or 1
    rows = (len(scaled) + cols - 1) // cols
    cell_h = max(im.height for _, im in scaled)
    pad = 12
    label_h = 20
    header_h = 54
    notes_h = 18 * len(notes) + (12 if notes else 0)

    width = cols * cell_width + (cols + 1) * pad
    height = header_h + rows * (cell_h + label_h + pad) + pad + notes_h
    sheet = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(sheet)

    d.text((pad, 12), f"ASSET CHECK — {slot_label}", fill=FG, font=title_font)
    d.text((pad, 33),
           f"output window {window[0]:.2f}s → {window[1]:.2f}s   "
           f"({window[1] - window[0]:.2f}s)   composited over live sources",
           fill=DIM, font=small)

    y = header_h
    for i, (t, img) in enumerate(scaled):
        col = i % cols
        row = i // cols
        x = pad + col * (cell_width + pad)
        yy = y + row * (cell_h + label_h + pad)
        sheet.paste(img, (x, yy))
        d.rectangle([x, yy, x + cell_width - 1, yy + img.height - 1], outline=(60, 60, 68))
        d.text((x + 2, yy + img.height + 4), f"t={t:.2f}s", fill=ACCENT, font=font)

    ny = height - notes_h - pad + 6
    for text, color in notes:
        d.text((pad, ny), text, fill=color, font=font)
        ny += 18

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


# -------- Manifest -----------------------------------------------------------
#
# assets.json is the asset plan the user approved BEFORE generation ran. It is
# the consistency contract across parallel sub-agents (which cannot see each
# other) and the count the gate checks the delivery against.

MANIFEST_NAME = "assets.json"


def _unfilled(value) -> bool:
    """A scaffolded placeholder counts as missing, not as an answer."""
    return not value or str(value).strip().upper() == "TODO"


def load_manifest(edit_dir: Path, explicit: Path | None, disabled: bool) -> dict | None:
    if disabled:
        return None
    path = explicit or (edit_dir / MANIFEST_NAME)
    if not path.exists():
        return None
    return json.loads(path.read_text())


def manifest_target_width(manifest: dict | None, fallback: int) -> int:
    if manifest:
        w = (manifest.get("target") or {}).get("width")
        if w:
            return int(w)
    return fallback


def pair_assets(manifest: dict, edl: dict, edit_dir: Path) -> tuple[dict, list[dict], list[dict]]:
    """Match manifest assets to EDL overlays by resolved output path.

    Returns (overlay_index -> asset, planned-but-unused, in-edit-but-unplanned).
    """
    assets = manifest.get("assets") or []
    overlays = edl.get("overlays") or []

    by_path: dict[str, dict] = {}
    for a in assets:
        if a.get("file"):
            by_path[str(resolve_path(str(a["file"]), edit_dir).resolve())] = a

    matched: dict[int, dict] = {}
    used: set[str] = set()
    unplanned: list[dict] = []
    for i, ov in enumerate(overlays):
        key = str(resolve_path(str(ov.get("file", "")), edit_dir).resolve())
        asset = by_path.get(key)
        if asset is None:
            unplanned.append(ov)
        else:
            matched[i] = asset
            used.add(key)

    unused = [a for a in assets
              if a.get("file")
              and str(resolve_path(str(a["file"]), edit_dir).resolve()) not in used]
    return matched, unused, unplanned


def check_manifest(manifest: dict, edl: dict, edit_dir: Path) -> tuple[list[str], list[str]]:
    """Plan-level checks. Returns (problems, info lines)."""
    problems: list[str] = []
    info: list[str] = []

    if not manifest.get("approved"):
        problems.append(
            "manifest has no `approved` value — assets were built before the plan was "
            "confirmed. Get the manifest signed off, then set it.")
    else:
        info.append(f"manifest approved {manifest['approved']}")

    concept = manifest.get("concept") or {}
    if _unfilled(concept.get("summary")):
        problems.append(
            "manifest has no `concept.summary` — nothing states the shared visual "
            "concept, so parallel sub-agents have no consistency contract.")

    _, unused, unplanned = pair_assets(manifest, edl, edit_dir)
    for a in unused:
        problems.append(
            f"planned asset '{a.get('id', a.get('file'))}' never enters the edit — "
            f"either place it or drop it from the manifest (a paid generation that "
            f"reaches nothing is still a cost).")
    for ov in unplanned:
        problems.append(
            f"overlay '{ov.get('file')}' is in the EDL but not in the manifest — "
            f"an unapproved asset entered the edit.")

    planned = len(manifest.get("assets") or [])
    info.append(f"{planned} asset(s) planned, {len(edl.get('overlays') or [])} in the edit")

    # Cost accounting: attempts vs delivered (assets-and-assembly.md §8).
    attempts = sum(int(a.get("attempts") or 1) for a in (manifest.get("assets") or []))
    discarded = sum(int(a.get("discarded") or 0) for a in (manifest.get("assets") or []))
    if discarded or attempts > planned:
        info.append(f"cost: {attempts} generation attempt(s) across {planned} delivered "
                    f"asset(s), {discarded} discarded")
    return problems, info


def check_against_spec(spec: dict, info: dict, ov: dict, slot_label: str
                       ) -> tuple[list[str], list[tuple[str, tuple[int, int, int]]]]:
    """Per-asset checks against its manifest entry."""
    problems: list[str] = []
    notes: list[tuple[str, tuple[int, int, int]]] = []

    kind = (spec.get("kind") or "authored").lower()
    planned_dur = float(spec.get("duration_s") or 0.0)
    headroom = float(spec.get("headroom_s") or 0.0)
    actual = info["duration"]

    edl_dur = float(ov.get("duration") or 0.0)
    if planned_dur and edl_dur and abs(planned_dur - edl_dur) > 0.05:
        msg = (f"EDL window is {edl_dur:.2f}s but the manifest planned {planned_dur:.2f}s "
               f"— the edit drifted from the approved plan")
        problems.append(f"[{slot_label}] {msg}")
        notes.append((f"! {msg}", WARN))

    if kind == "generated" and planned_dur:
        want = planned_dur + headroom
        if actual < want - 0.05:
            msg = (f"generated asset is {actual:.2f}s but needs {want:.2f}s "
                   f"({planned_dur:.2f}s window + {headroom:.2f}s headroom) — "
                   f"no material to re-cut into on revision")
            problems.append(f"[{slot_label}] {msg}")
            notes.append((f"! {msg}", WARN))
        elif abs(actual - planned_dur) < 0.05 and headroom <= 0:
            notes.append(("generated asset exactly fills its window — timing is locked, "
                          "plan headroom next time", WARN))
        else:
            notes.append((f"generated, {actual - planned_dur:.2f}s of headroom to cut into", OK))

    for key, label in (("width", "width"), ("height", "height")):
        want = spec.get(key)
        if want and int(want) != info[key]:
            msg = f"{label} {info[key]}px vs manifest {int(want)}px"
            problems.append(f"[{slot_label}] {msg}")
            notes.append((f"! {msg}", WARN))

    want_fps = spec.get("fps")
    if want_fps and info["fps"] and abs(float(want_fps) - info["fps"]) > 0.5:
        msg = f"fps {info['fps']:.2f} vs manifest {float(want_fps):.2f}"
        problems.append(f"[{slot_label}] {msg}")
        notes.append((f"! {msg}", WARN))

    if _unfilled(spec.get("constraint")):
        problems.append(f"[{slot_label}] manifest entry has no composition constraint — "
                        f"nothing states what this asset has to leave room for")
    else:
        notes.append((f"must satisfy: {spec['constraint']}", ACCENT))

    return problems, notes


def scaffold_manifest(edl: dict, edit_dir: Path, out_path: Path, width: int) -> None:
    """Migration aid for a project that already has an EDL. The normal path is
    to write the manifest BEFORE generating anything."""
    assets = []
    for ov in edl.get("overlays") or []:
        f = str(ov.get("file", ""))
        assets.append({
            "id": Path(f).parent.name or Path(f).stem,
            "kind": "authored",
            "engine": "TODO",
            "file": f,
            "width": width,
            "height": None,
            "fps": None,
            "duration_s": float(ov.get("duration") or 0.0),
            "headroom_s": 0.0,
            "purpose": "TODO",
            "constraint": "TODO",
            "attempts": 1,
            "discarded": 0,
        })
    manifest = {
        "version": 1,
        "concept": {"summary": "TODO", "palette": {}, "font": None, "constraints": []},
        "target": {"width": width, "height": None, "fps": None},
        "assets": assets,
        "approved": None,
    }
    out_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Scaffolded {out_path} from the EDL.")
    print("Fill the TODOs, confirm it with the user, then set `approved`.")


# -------- Main ---------------------------------------------------------------


def check_overlay(
    idx: int,
    ov: dict,
    edl: dict,
    spans,
    edit_dir: Path,
    out_dir: Path,
    n_frames: int,
    target_width: int,
    tmp: Path,
    spec: dict | None = None,
) -> tuple[bool, list[str]]:
    problems: list[str] = []
    notes: list[tuple[str, tuple[int, int, int]]] = []

    ov_path = resolve_path(str(ov["file"]), edit_dir)
    slot_label = (spec or {}).get("id") or (
        ov_path.parent.name if ov_path.parent.name.startswith("slot") else ov_path.name)

    if not ov_path.exists():
        problems.append(f"[{slot_label}] overlay file missing: {ov_path}")
        return False, problems

    start = float(ov.get("start_in_output", 0.0))
    declared = float(ov.get("duration", 0.0))
    info = probe(ov_path)
    actual = info["duration"]

    # --- spec checks -------------------------------------------------------
    if declared and abs(actual - declared) > 0.05:
        msg = (f"duration mismatch: render is {actual:.2f}s, EDL window declares "
               f"{declared:.2f}s (delta {actual - declared:+.2f}s)")
        problems.append(f"[{slot_label}] {msg}")
        notes.append((f"! {msg}", WARN))
    else:
        notes.append((f"duration {actual:.2f}s matches declared window", OK))

    if info["width"] != target_width:
        msg = (f"width {info['width']}px vs render target {target_width}px — "
               f"overlay anchors at 0,0 and will not fill the frame")
        problems.append(f"[{slot_label}] {msg}")
        notes.append((f"! {msg}", WARN))
    else:
        notes.append((f"resolution {info['width']}x{info['height']}", OK))

    if spec:
        sp_problems, sp_notes = check_against_spec(spec, info, ov, slot_label)
        problems.extend(sp_problems)
        notes.extend(sp_notes)

    total = float(edl.get("total_duration_s") or (spans[-1][1] if spans else 0.0))
    window_end = start + (declared or actual)
    if total and window_end > total + 0.01:
        msg = f"window ends at {window_end:.2f}s, past the {total:.2f}s timeline"
        problems.append(f"[{slot_label}] {msg}")
        notes.append((f"! {msg}", WARN))

    # --- sample the window -------------------------------------------------
    span = declared or actual
    if n_frames == 1:
        times = [start + span / 2.0]
    else:
        step = span / (n_frames - 1)
        times = [start + i * step for i in range(n_frames)]

    cells: list[tuple[float, Image.Image]] = []
    uncovered = 0
    unreadable = 0
    for i, t in enumerate(times):
        mapped = source_frame_for(spans, min(t, max(0.0, (total or span) - 0.001)))
        base_img = None
        if mapped:
            src, src_t = mapped
            if src.exists():
                bp = grab_frame(src, src_t, tmp / f"b_{idx}_{i}.png", width=target_width)
                if bp:
                    base_img = Image.open(bp)
        if base_img is None:
            uncovered += 1
            h = int(target_width * (info["height"] / info["width"])) if info["width"] else 540
            base_img = Image.new("RGB", (target_width, h), (30, 30, 34))

        # Clamp inside the last whole frame — seeking to duration-epsilon lands
        # past the final frame and ffmpeg returns nothing.
        tail = (1.5 / info["fps"]) if info["fps"] else 0.05
        ov_t = min(max(0.0, t - start), max(0.0, actual - tail))
        op = grab_frame(ov_path, ov_t, tmp / f"o_{idx}_{i}.png")
        ov_img = Image.open(op) if op else None
        if ov_img is None:
            unreadable += 1

        cell = compose_cell(base_img, ov_img)
        draw_sub_band(cell, load_font(11))
        cells.append((t, cell))

    if uncovered:
        msg = f"{uncovered}/{len(times)} sample(s) had no live source underneath"
        notes.append((f"! {msg}", WARN))
        problems.append(f"[{slot_label}] {msg}")

    if unreadable:
        msg = f"{unreadable}/{len(times)} overlay frame(s) unreadable"
        notes.append((f"! {msg}", WARN))
        problems.append(f"[{slot_label}] {msg}")

    notes.append(("orange band = where burned-in subtitles land (Hard Rule 1)", DIM))

    out_path = out_dir / f"asset_check_{slot_label}.png"
    build_sheet(slot_label, (start, start + span), cells, notes, out_path)
    print(f"  {slot_label}: {out_path}")
    return not problems, problems


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl", type=Path)
    ap.add_argument("--slot", type=int, default=None,
                    help="check only the Nth overlay (1-based)")
    ap.add_argument("--n-frames", type=int, default=5)
    ap.add_argument("--width", type=int, default=1920,
                    help="render target width; a manifest's target.width wins")
    ap.add_argument("--out-dir", type=Path, default=None)
    ap.add_argument("--manifest", type=Path, default=None,
                    help=f"asset manifest (default: {MANIFEST_NAME} next to the EDL)")
    ap.add_argument("--no-manifest", action="store_true",
                    help="ignore the manifest and check against the EDL alone")
    ap.add_argument("--scaffold", action="store_true",
                    help="write a starter manifest from the EDL and exit (migration aid)")
    args = ap.parse_args()

    edl = json.loads(args.edl.read_text())
    edit_dir = args.edl.parent
    out_dir = args.out_dir or (edit_dir / "verify")

    if args.scaffold:
        dest = args.manifest or (edit_dir / MANIFEST_NAME)
        if dest.exists():
            print(f"{dest} already exists — refusing to overwrite it.", file=sys.stderr)
            sys.exit(1)
        scaffold_manifest(edl, edit_dir, dest, args.width)
        return

    manifest = load_manifest(edit_dir, args.manifest, args.no_manifest)
    target_width = manifest_target_width(manifest, args.width)

    overlays = list(enumerate(edl.get("overlays") or []))
    if not overlays:
        print("No overlays in this EDL — nothing to gate.")
        return

    all_problems: list[str] = []

    if manifest:
        matched, _, _ = pair_assets(manifest, edl, edit_dir)
        plan_problems, plan_info = check_manifest(manifest, edl, edit_dir)
        all_problems.extend(plan_problems)
        print(f"Manifest: {args.manifest or (edit_dir / MANIFEST_NAME)}")
        for line in plan_info:
            print(f"  {line}")
    else:
        matched = {}
        if not args.no_manifest:
            print(f"No {MANIFEST_NAME} beside the EDL — checking against the EDL alone.")
            print(f"  The manifest is the plan the user approved before generation ran; "
                  f"without it the gate cannot tell a delivered asset from an unapproved one.")
            print(f"  `--scaffold` writes a starter one from this EDL.")

    if args.slot:
        overlays = [overlays[args.slot - 1]]

    spans = build_output_map(edl, edit_dir)
    if not spans:
        print("warning: EDL has no ranges — sheets will show overlays on a flat field.",
              file=sys.stderr)

    print(f"Asset check: {len(overlays)} overlay(s) → {out_dir}")
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        for i, ov in overlays:
            _, problems = check_overlay(i + 1, ov, edl, spans, edit_dir, out_dir,
                                        args.n_frames, target_width, tmp,
                                        spec=matched.get(i))
            all_problems.extend(problems)

    print()
    if all_problems:
        print(f"{len(all_problems)} problem(s) — fix before assembly:")
        for prob in all_problems:
            print(f"  ! {prob}")
        sys.exit(1)
    print("All overlays pass the spec gate. Read the sheets before rendering:")
    print("  legibility over the real background, collision with the subtitle band,")
    print("  and whether the asset belongs to the same campaign as the footage.")


if __name__ == "__main__":
    main()
