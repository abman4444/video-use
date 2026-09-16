# NOVA Prices Reel

A Remotion build of the Fairfax County price reel described in the brief:
1080 × 1920, 30fps, 2040 frames (68.0s), white throughout, built to loop.

```bash
npm install
npm run dev          # Remotion Studio
npm run verify       # assert the timing contract (no browser needed)
npm run render       # out/nova-prices-reel.mp4
```

`npm run verify` is the part worth running first. It bundles the pure state function and
probes all 2040 frames in plain Node — no browser, no screenshots — and enforces the
brief's own sanity check:

> at every frame caption 2 is on screen, the big readout above it must say
> **2009 / $408,000**. If it says 2016 or 2022, the draw is still progress-eased.

It also enforces the trap one line below that: the 2009 trough must read **blue**. The
line has just fallen for three years, but 2010 happens to be higher, so a forward-looking
direction test paints the bottom of the crash as a gain.

## How it is put together

One continuous element tree, not nine sequences. Everything is authored in **seconds
against absolute time** — each element computes its own opacity and transform from `T` and
a cue constant — which is what lets elements cross scene boundaries: the chart persists
from Climb through Rates into Gap, and the subject-line eyebrow leaves and comes back.

Elements fade out by subtraction, not with a second component. `life()` in `src/reel.ts`
takes any number of windows and alternates entrance and exit, so the live readout's two
exits and two entrances are one element with four terms.

| file | what lives there |
|---|---|
| `src/timing.ts` | every cue and window in the piece, in seconds, plus the walker's six beats |
| `src/data.ts` | three public series, chart geometry, the payment maths, seeded scatters |
| `src/reel.ts` | the pure state function — draw, rate ride, camera, every opacity |
| `src/Chart.tsx` | the SVG: two-colour price line, rate line, the labelled car, both callouts |
| `src/Question.tsx` | Scene 1 — house motif, the house that builds itself, marker highlights |
| `src/Investigate.tsx` / `src/Guy.tsx` | Scene 2 — the floating portrait, the write-on, the walker |
| `src/Overlays.tsx` | live readout, captions, rates title, delta headline, money motif |
| `src/Split.tsx` `src/Sold.tsx` `src/Payment.tsx` `src/Close.tsx` | Scenes 6–9 |
| `src/icons.tsx` | Lucide `house`, `layers`, `phone` as path data |
| `scripts/verify-timing.mjs` | the timing contract, asserted |

### The draw, and the ride

The price line is keyframed in **year** space (`drawYearAt`). Four additive segments, with a
deliberate gap between the second and third that gives the 1.6s hold at the 2009 trough for
free. Progress is derived from the year, never the reverse.

The rate line is the opposite: **linear**, 51 years in 6.2 seconds. `RIDE` is `t => t` and
the verifier asserts that the ride covers equal years per second throughout. An ease-in-out
would make a vehicle accelerate through the middle of its own journey.

### Assets you need to drop in

Everything under `public/` marked PLACEHOLDER is a stand-in. Replace the file and point the
matching `defaultProps` entry in `src/Root.tsx` at it — nothing else changes.

| prop | current placeholder | wants |
|---|---|---|
| `logoSrc` | `logo-mark.svg` | the house-and-key mark, square-ish, transparent |
| `portraitFindOut` | `portraits/ahmed-findout.svg` | head-down shot, **monotone**, 760 × 968 (2× the 380 × 484 slot) |
| `portraitColor` | `portraits/ahmed-color.svg` | direct-to-camera headshot, **full colour**, 304 × 388 |
| `brokerageSrc` | `brand/douglas-realty.svg` | Douglas Realty logo |
| `equalHousingSrc` | `brand/equal-housing.svg` | Equal Housing Opportunity mark |
| — | `public/sold/sf-1..4`, `tw-1..3` | seven MLS exports, centre-cropped 4:3 at 560 × 420, vertical anchor 0.46 |

The portrait recipes (monotone ramp, luminance-ratio unsharp) are in the brief; do them in
processing, not as a CSS filter, or the Investigate plate stops matching the palette.

The 3D logo sting is deliberately **not** in this composition — at the 144px the closing
lockup allows, its keyed edges go soft. Use it as a top or tail card in the edit.

### Type and icons

Geist, Geist Mono and Caveat are vendored as latin-subset woff2 under `public/fonts` (all
SIL OFL 1.1), and the three Lucide glyphs ship as path data in `src/icons.tsx`. Nothing is
fetched at render time.

### Reduced motion

`reducedMotion` is a composition prop. Left undefined it reads the viewer's
`prefers-reduced-motion`; set it explicitly to keep a render deterministic. It drops the
camera moves, the rises, the walk cycle, the wipes and the lockup's scale-in. The line
draw, the rate ride and the counters stay — they are the content.

## Where the build departs from the brief

The brief carries a layer of timings and figures from an earlier, shorter cut. Where two
passages disagree, the later one wins; where the numbers and the rendered frame disagree,
the frame wins. Each of these is commented at the line that makes the change.

**Stale timings, corrected**

1. **Scene 1 exits at Investigate−0.55, not Q+4.0.** The brief's exit predates this scene
   growing 4.4s → 5.2s for the house build. Left at 4.0 it opens **0.9s of white** before
   Investigate arrives.
2. **The walker leaves at Investigate+11.1, not +7.15.** The brief gives both; the beat
   chain it specifies runs to +8.01, so at +7.15 he fades out mid-scratch.
3. **The Investigate block holds to +11.1 too.** At the scene's stated 11.6s the statement
   has to still be up for the walker to read it and for the flash beat to land against it.
4. **Caption 2 ends on the hold (Climb+5.8), not 0.05s past it.** One frame past and the
   line has started to climb, so the readout flips red under a caption about a fall — which
   contradicts the brief's own stated invariant two lines later.
5. **Every panel exit lands exactly on the next panel's entrance.** The brief's
   `−0.6 → −0.15` out against a `−0.05 → +0.45` in leaves a 4-frame dip to white at each of
   three scene changes; `chartOut` already meets `panelIn` exactly, so the rest were matched
   to it. Payment → Close was a 0.4s hole for the same reason.
6. **The rate car rides to the end of the ride.** The brief exits it at Rates+3.6, which is
   from the 2.75s cut; the ride is now 6.2s, so it would leave the line half-drawn. It now
   leaves with the rest of the rate layer.

**Judgement calls**

7. **The 2008 callouts do not come back for Gap.** The brief returns them at Gap−0.4. At
   the 2× zoom they render at double size across the gap measure and the 2016 ring. This is
   the same noise argument the brief itself makes for stripping the rate layer before Gap.
8. **The close headline is 88px, not 96px.** At 96px in Geist 800 it wraps to three lines in
   the 900px measure and pushes the lockup through the portrait row pinned at 1296. 88px is
   the largest size that holds it to two.
9. **Fade-outs are linear, fade-ins use `enter`.** The brief names curves for arrivals and
   draws and says nothing about exits. An out-quart fade-out dumps most of its opacity in
   the first frames, which left a visible white gap at every handoff.
10. **The `→` in the Split money rows is drawn, not typed.** The vendored latin subset does
    not promise U+2192.

**Stale figures, and which pair is live**

The brief mixes a 2015 → 2025 comparison with a 2016 → 2026 one. The 2016 → 2026 pair is
live and self-consistent — it is the one every current figure reconciles against:

| | |
|---|---|
| 2016 | $487,000 at 3.65% → **$1,782/mo** |
| 2026 | $813,000 at 6.37% → **$4,056/mo** |
| delta | **+$326,255**, shown as +$326,000 |
| price | **+67%** &nbsp;&nbsp; payment | **+128%** &nbsp;&nbsp; real | **+21%** |

Everything is computed in `src/data.ts` rather than typed in, and the verifier asserts each
one. The brief's `$1,781/mo` is a rounding artefact — the formula it also gives returns
$1,782. Passages still naming +$261,000, $479K or "13.7% / 54.5%" are from the 2015 cut.

Two more notes: the brief's "No photography" rule contradicts Scene 7, which is entirely
photographs and which the brief calls the single biggest upgrade available to the piece —
the photographs stay. And the Gap framing shows roughly 2002 onward, not 2016 onward: scale
2.0 centred on chart x 885 puts the frame's left edge at x 615. The numbers are followed as
given.

## Rendering without a downloadable Chrome

Remotion fetches its own Chrome Headless Shell on first render. Where that download is
blocked, point it at a local one:

```bash
npx remotion render src/index.ts NovaPricesReel out/nova-prices-reel.mp4 \
  --browser-executable=/path/to/headless_shell --gl=angle
```
