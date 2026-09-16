# NOVA Prices Reel

A Remotion build of the Fairfax County house-price reel described in the brief:
1080 × 1920, 30fps, 828 frames (27.6s), white throughout, built to loop.

```bash
npm install
npm run dev          # Remotion Studio
npm run verify       # assert the timing contract (no browser needed)
npm run render       # out/nova-prices-reel.mp4
```

`npm run verify` is the part worth running first. It is a pure-Node probe of the
state function, not a screenshot diff, and it enforces the brief's own sanity check:

> at every frame caption 2 is on screen, the big readout above it must say
> **2009 / $408,000**. If it says 2016 or 2022, the draw is still progress-eased.

## How it is put together

One continuous element tree, not five sequences. The chart mounts once and is moved
by a single camera transform; text blocks cross-fade over it.

| file | what lives there |
|---|---|
| `src/timing.ts` | every frame number in the piece, including the draw keyframes |
| `src/data.ts` | the FHFA series, chart geometry, segment figures, money formatting |
| `src/reel.ts` | the pure state function — draw, camera, and every opacity, from one frame |
| `src/Chart.tsx` | the SVG: grid, ghost, area, line, tip, decade flashing, both callouts |
| `src/Overlays.tsx` | eyebrow, hook, live readout, captions, delta headline, corner mark |
| `src/Split.tsx` | Scene 4 — the two segment cards |
| `src/Close.tsx` | Scene 5 — CTA, lockup, sources |
| `scripts/verify-timing.mjs` | the timing contract, asserted |

### The draw

The line is keyframed in **year** space, never in progress space
(`drawYearAt` in `src/reel.ts`). Four additive segments, with a deliberate gap
between the second and third that gives the 1.6s hold at the 2009 trough for free.
Progress is derived from the year, not the other way round — that is what makes every
caption timing deterministic.

### Camera

`cameraAt` returns `{scale, fx, fy}`: a scale and a focus point in the 1400 × 1920
chart space, mapped onto the 1080-wide frame. The chart SVG is wider than the frame so
the Gap zoom (scale 2.0 on 883, 800) does not clip the annotations to the right of the
2025 point.

### Assets

- **Logo.** `public/logo-mark.svg` is a placeholder. Drop the real artwork into
  `public/` and point the composition's `logoSrc` prop at it
  (`defaultProps` in `src/Root.tsx`, or `--props` at render time).
- **Type.** Geist and Geist Mono are vendored as variable woff2 (latin subset) under
  `public/fonts/`, so a render never depends on the network. Both are SIL OFL 1.1.

### Reduced motion

`reducedMotion` is a composition prop. Left undefined it reads the viewer's
`prefers-reduced-motion`; set it explicitly to keep a render deterministic. It drops
the camera moves, the rises and the lockup's scale-in, and turns the accent swipes into
opacity fades. The line draw and the counters stay — they are the content, not decoration.

## Where the build departs from the brief

Four places, all of them cases where the brief's numbers and the brief's intent
disagreed once the type was actually set:

1. **Hook headline at 100px, not 104px.** At 104px in Geist 800 the second line
   measures ~925px against 920px of column, so the browser re-wraps the hard break
   into three lines. The hard break is the point; the type gives up 4px.
2. **The 2015 / $479K stack sits higher above its ring.** At the Gap zoom the frame
   only shows chart x 613–1153, so the stack cannot move further left to clear the
   2006 peak — it moves up instead.
3. **Fade-outs are linear, fade-ins use `enter`.** The brief names three curves for
   arrivals and draws and says nothing about exits. An out-quart fade-out dumps most of
   its opacity in the first frames, which left a visible white gap at every handoff.
   Straight down is a film dissolve, not a fourth curve.
4. **Scene 4 → Scene 5 uses the same handoff shape as Scene 3 → Scene 4.** The brief
   times every other transition but not this one; cross-fading two dense screens of
   type over each other reads as a smear, so the panel is fully out (frames 679–697)
   before the close begins (697–720).

Two more notes on fidelity:

- **The Gap framing shows 2002 onward, not 2015 onward.** Scale 2.0 centred on x 883
  puts the left edge of the frame at chart x 613, which is roughly 2002. The numbers
  are followed as given; "2015 → 2025 only" is the story's focus, not the viewport.
- **The `→` in the Scene 4 money rows is drawn, not typed.** The vendored latin subset
  does not promise U+2192, and a tofu box mid-row would be worse than an SVG glyph
  matched to the mono stroke.

## Rendering without a downloadable Chrome

Remotion fetches its own Chrome Headless Shell on first render. Where that download is
blocked, point it at a local one:

```bash
npx remotion render src/index.ts NovaPricesReel out/nova-prices-reel.mp4 \
  --browser-executable=/path/to/headless_shell --gl=angle
```
