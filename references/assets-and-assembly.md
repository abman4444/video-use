# Assets vs. assembly

Deep dive on the third job in Sanji Nai-Chien's *"GPT-6 Astra: Automate Your Entire
DaVinci Resolve Pipeline"* — turning one product photo into a 15s ad — and what it
implies for `video-use`. Companion to `references/directing-revisions.md`.

---

## 1. What he actually did

> "Before creating anything, I separate the job into two parts. First, we need the
> supporting visuals — a background and two short clips. Then we need an edit that brings
> those assets together with the product, typography and sound."

He says this *before* the brief, and then writes the brief in two clearly separated halves:

**Phase A — generate.**
> "Use Higgsfield to create **one background image and two short supporting clips** for a
> premium ad based on this product photo. Choose a visual concept that suits the product
> and **keep the assets consistent**."

**Phase B — assemble.**
> "Use those assets and the original photo to build a 15-second ad in DaVinci. Give it a
> strong opening, a clear product reveal, changes in scale, and sound design. End on a
> clean product shot with a short line that fits the product. Make it 16×9 and keep the
> edit, text, and transitions editable."

Then he reviews Phase A **on its own**, before looking at any edit.

## 2. Why the split exists

It isn't tidiness. The two phases have opposite economics:

| | Generation | Assembly |
|---|---|---|
| Cost per attempt | high (credits, minutes) | ~free (seconds of ffmpeg) |
| Determinism | none — same prompt, different result | total — same EDL, same output |
| Reversible | no, you pay again | yes, edit a number |
| Who decides | the model | you |

Every revision you can push onto the assembly side is a revision that costs nothing and
lands where you actually have control. That's the whole game. His proof is the second ad
version:

> "I'm changing the opening and keeping the rest of the ad in place. Astra can use the
> material that we already have to introduce the product differently. **We can work with
> the material already in the project.**"

A whole alternative creative direction, zero new generations. And the warning if you don't
split:

> "Having to replace the product treatment or to rebuild the scene with every revision
> would quickly eat into your budget."

**The rule:** the expensive, non-deterministic step happens once and early; everything you
expect to iterate on lives downstream of it.

## 3. The line between the phases

The thing most people get wrong, stated plainly in the video:

> "Astra has to **choose which moments to use from the clips**, place the product, and build
> the transitions around the timing of the ad. **The generated material is simply one part
> of that work.**"

Generated clips are **raw material, not shots.** The generator does not know where the cut
falls, how long the reveal needs, or what comes before it. So:

**Belongs to generation** — the visual concept; asset count and kind; the consistency
contract (same lighting, same palette, same campaign); composition constraints that must be
baked in (negative space for the product, space for text).

**Belongs to assembly** — which moments get used; in/out points; ordering; duration of each
beat; scale changes; transitions; typography; sound design; the format.

**Never ask a generator for an edit decision.** "Generate the opening shot" bakes a cut
decision into the expensive, unrepeatable step. Ask for material, then cut an opening out
of it. If the opening needs to change later — and in his video it does — you re-cut instead
of re-generating.

Corollary for us: prefer to **over-generate slightly and cut in**, rather than generate to
an exact length. An asset that is 20% longer than its slot gives assembly room to move; an
asset generated to exactly 5.00s locks the timing before you've seen it in context.

## 4. Declare the manifest before generating

He specifies **one background image and two short supporting clips** — a count, before
anything runs. Not "generate some supporting visuals."

Do the same: before spawning any generation, write `<edit>/assets.json` and get it confirmed
in the strategy step. It is a real artifact, not a note — `asset_check.py` reads it and
checks the delivery against it.

```json
{
  "version": 1,
  "concept": {
    "summary": "premium, cool daylight, single product hero on deep neutral",
    "palette": {"bg": "#101216", "accent": "#C8A46A"},
    "font": "/System/Library/Fonts/Helvetica.ttc#1",
    "constraints": ["no competing product colors", "one light direction: key from camera left"]
  },
  "target": {"width": 1920, "height": 1080, "fps": 30},
  "assets": [
    {"id": "slot_1", "kind": "generated", "engine": "external",
     "file": "animations/slot_1/render.mp4",
     "width": 1920, "height": 1080, "fps": 30,
     "duration_s": 4.0, "headroom_s": 2.0,
     "purpose": "background plate",
     "constraint": "negative space in the right third for the product, room for a title",
     "attempts": 1, "discarded": 0},
    {"id": "slot_2", "kind": "generated", "engine": "external",
     "file": "animations/slot_2/render.mp4",
     "width": 1920, "height": 1080, "fps": 30,
     "duration_s": 3.0, "headroom_s": 1.5,
     "purpose": "supporting motion, no product",
     "constraint": "same key direction as slot_1, no text-competing detail",
     "attempts": 1, "discarded": 0}
  ],
  "approved": null
}
```

`approved` stays `null` until the user confirms — and the gate fails on a `null`, because a
manifest that was never signed off means assets got built before the plan existed. `kind`
picks the mode from §6. `headroom_s` is the material beyond the window that §3 says to
over-generate; zero headroom means the timing is locked before you have seen the asset in
context. `constraint` is required — an asset with no stated constraint has no test to fail.
`attempts` / `discarded` carry the cost accounting in §8.

Four things the manifest buys:
- The user can veto the *plan* for ~zero cost, instead of vetoing the *output* after paying.
- It's the consistency contract — every parallel sub-agent gets the identical palette, light
  direction, and framing constraint, which is the only mechanism enforcing "keep the assets
  consistent" across agents that can't see each other. Copy `concept` verbatim into each brief.
- It becomes the count you check against. Three assets asked for, three assets reviewed —
  and the gate flags both directions: a planned asset that never reaches the edit (paid for,
  wasted) and an overlay in the EDL that was never in the manifest (unapproved).
- It records what generation actually cost, including the attempts you threw away.

Adopting it on a project that already has an EDL: `asset_check.py <edl.json> --scaffold`
writes a starter manifest from the existing overlays with the judgement fields left as
`TODO`. That's a migration aid — the normal path is manifest first, generation second. The
gate treats a leftover `TODO` as unfilled, so a scaffold you never completed fails loudly
instead of passing silently.

## 5. The asset gate

He reviews the generated assets **before** looking at any edit, and his criteria are all
about fitness-for-use, not beauty:

> "The lighting and the colors need to belong to the same campaign, and the composition
> needs room for the product. **A background can look great on its own and still be too
> busy behind the label.** So I'm checking how it supports the product and whether it leaves
> enough space for readable text."

That last sentence is the whole principle: **an asset is judged in the context it will be
used in, not in isolation.** A slot render that looks perfect in its own preview window can
still be wrong in the edit.

For `video-use` the equivalent failure modes are concrete and mostly mechanical:

| Failure | Caught by |
|---|---|
| Overlay illegible over the footage actually under it | eye, on a real composite |
| Overlay sits where burned-in subtitles land (Hard Rule 1) | eye, with the band drawn |
| Overlay clashes with the grade | eye, on a graded frame |
| Render duration ≠ the EDL window | spec check |
| Render resolution ≠ target (overlay anchors 0,0, won't fill) | spec check |
| Window runs past the end of the timeline | spec check |
| Delivered spec ≠ the approved manifest entry | manifest check |
| Generated asset with no headroom to re-cut into | manifest check |
| Planned asset that never reaches the edit | manifest check |
| Overlay in the edit that was never approved | manifest check |
| Generation ran before the plan was signed off | manifest check |
| Assets don't match each other | eye, sheets side by side |

`helpers/asset_check.py` does this. It walks the EDL's output timeline to find which source
frame is live under each overlay window, composites the overlay the same way `render.py`
will (native size, anchored 0,0), draws the subtitle safe band, and writes one contact sheet
per slot to `<edit>/verify/`. It pulls single frames straight from the sources — it never
renders the base or the final, so the gate stays cheap regardless of timeline length. Spec
mismatches print as text and exit non-zero.

```bash
python helpers/asset_check.py <edit>/edl.json
python helpers/asset_check.py <edit>/edl.json --slot 2 --n-frames 8
```

Run it after the animation sub-agents return and **before** `render.py`. A failure here
costs one slot re-render; the same failure found at self-eval costs a full composite, and
found by the user costs a round trip.

Note this does not replace self-eval (process step 7). The gate checks assets against the
edit; self-eval checks the *rendered output* at cut boundaries. Different failures.

## 6. Two generation modes

`video-use` and the video actually sit at opposite ends of a spectrum, and both modes are
valid — pick per slot:

**Authored-to-fit** (what `video-use` does today). PIL / Remotion / HyperFrames / Manim
slots are built to an exact duration against a known window, with payoff timing synced to a
narration word. Deterministic, re-runnable, free to re-render. The window is known first and
the asset is made to it.

**Generated-then-cut** (what the video does). Generative material is non-deterministic and
paid-for, so you generate loose material and make the edit decisions afterwards in assembly.
The asset exists first and the window is cut out of it.

The split in this document matters most for the second mode — but the manifest, the
consistency contract and the asset gate are worth applying to both. An authored slot can be
re-rendered for free, which makes catching its problems at the gate even cheaper.

## 7. Revision policy

Once the split exists, revisions get a priority order. Try them in this sequence and stop at
the first one that works:

1. **Re-select** — different moments from the material you already have. (His opening swap.)
2. **Re-time** — same material, different in/out points or hold durations.
3. **Re-place / re-compose** — same material, different position, scale or order. A 9:16
   version is this, not a new generation.
4. **Re-render an authored slot** — free, deterministic.
5. **Re-generate** — last resort. Needs a reason you can state: the asset is genuinely
   wrong for the concept, not just not-your-favorite.

If a revision request keeps forcing you to step 5, the manifest was wrong — the assets were
generated too tightly to one edit. Fix the manifest, not the prompt.

## 8. Cost accounting

> "The cost comparison needs to cover the complete job — the generated assets, the software,
> and the time spent reviewing and correcting the edit. **Every unused generation still
> belongs in that total.** The useful comparison is what it takes to reach the versions
> you're actually going to deliver. That includes the feedback after the first render."

If `project.md` records generation counts, record the discarded ones too. The number that
matters is total generations to reach the delivered set, not generations in the delivered
set.

---

## Checklist

Before generating:
- [ ] `<edit>/assets.json` written: count, kind, resolution, duration, per-asset constraint
- [ ] `concept` stated as concrete values, copied verbatim into every sub-agent brief
- [ ] Generated slots carry `headroom_s` > 0
- [ ] No edit decisions inside a generation prompt
- [ ] User confirmed the manifest and `approved` is set

After generating, before assembly:
- [ ] `asset_check.py` clean (spec gate passes)
- [ ] Contact sheets read: legible over real footage, clear of the subtitle band, grade-consistent
- [ ] Assets look like one campaign when viewed together

On revision:
- [ ] Walked the re-select → re-time → re-place → re-render → re-generate ladder in order
- [ ] Any re-generation has a stated reason
- [ ] Discarded generations recorded in the manifest's `discarded` counts
