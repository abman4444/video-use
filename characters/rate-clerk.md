# The rate clerk — Higgsfield prompt pack

Original character for the reel, replacing the hand-drawn walker. Separate build from
Mr. Prime (`interest-rate-mascot.md`) — different silhouette, different era, different
job. Frames are generated on flat white so they key cleanly onto a timeline.

---

## Character block (identical in every prompt)

> A tall, thin, clean-shaven man in his early sixties. Long narrow face, prominent hooked
> nose, high forehead, short grey hair at the sides, balding on top. He wears a green bank
> teller's eyeshade, a white shirt with the sleeves rolled and black elastic arm garters, a
> thin dark necktie, grey trousers and plain black shoes. He carries a narrow paper ticker
> tape in one hand. No hat, no glasses, no moustache, no cane, no waistcoat, no jacket.

The six exclusions are load-bearing — they are what keeps him clear of existing mascots.
Never drop them.

## Style block (identical in every prompt)

> 1930s rubber-hose cartoon style, hand-inked. Bold uniform black outlines, flat fills, no
> gradients. Four-finger white gloves. Round expressive eyes with a single white highlight.
> Slightly curved rubber-hose limbs. Cross-hatched shading only. Full body, head to shoes,
> centred.

**Resolved conflict:** the original brief's style line ended "aged off-white paper
background" while the technical line demanded flat white for keying. Flat white wins —
a paper texture forces a hand cutout and ragged edges. The aged-paper clause is dropped.

**Second conflict:** the style line ends "facing the viewer", which fights the walk poses.
"Facing the viewer" is carried only on the standing frames (3 and 4); the walk frames let
the pose sentence set the angle.

## Technical block (identical in every prompt)

> Plain flat white background, no shadow, no ground line, no border, no text, no watermark,
> no signature. The figure fully inside the frame with generous empty margin on all sides.
> Pure flat white background, absolutely no paper texture, no grain, no vignette, no drop
> shadow, no cast shadow, no contact shadow beneath the feet, no floor, no horizon line.
> No top hat, no round glasses, no pince-nez, no handlebar moustache, no walking cane, no
> pinstripe waistcoat, no jacket, no bow tie. Single figure only, exactly one character, no
> other people, no duplicate figures, no extra limbs, no extra fingers, no distorted
> anatomy, no cropped feet, no cropped head.

The second half is added reinforcement beyond the original brief — the shadow and texture
negatives need restating several ways or the model reintroduces a contact shadow, and the
mascot exclusions need restating as negatives, not just as prose in the character block.

---

## Pose lines

1. **Walk, contact** — walking to the right in profile-three-quarter view, left leg forward
   and planted, right leg back, arms swinging in opposition, ticker tape trailing from his
   back hand.
2. **Walk, passing** — mid-stride, legs close together, one foot lifted just off the ground,
   body slightly raised, arms near his sides.
3. **Walk, down** *(the added in-between)* — weight fully settled onto the front leg with
   that knee bent, body dropped to its lowest point, back foot toe still touching, arms
   mid-swing in opposition.
4. **Looking up, surprised** — standing still, facing the viewer, both feet planted. Head
   tilted back looking sharply upward, eyes wide and pupils raised, eyebrows lifted, mouth
   slightly open, eyeshade pushed up on his forehead.
5. **Scratching his head, puzzled** — standing still, facing the viewer. Right hand raised
   to scratch his temple, elbow out and bent. Left hand hanging at his side holding the
   ticker tape. Head tilted, one eyebrow raised, mouth skewed to one side in confusion.
6. **Riding the rate line** — seated side-saddle on a thick rising diagonal line as if
   riding it upward, one hand gripping the line, the other holding his eyeshade to his head,
   ticker tape streaming behind him. The line is a plain solid black stroke from lower left
   to upper right and nothing else.

---

## Generation log

Run 2026-09-17. `seedream_v5_pro`, 3:4, 2k — 1760x2352, comfortably over the 1500px-tall
requirement. 18 credits. Frame 1 generated standalone, then used as the `image_references`
input for all five others so the face and clothes carry.

| # | Frame | Seed | Job ID |
|---|-------|------|--------|
| 1 | Walk, contact | `144478` | `9a90b197-7c17-4262-86e5-26eefb849ee9` |
| 2 | Walk, passing | `876835` | `0996e001-bb81-4d17-be81-58decda5742b` |
| 3 | Walk, down (in-between) | `904504` | `f627c339-3e54-4c20-a7ee-98c3c72d254f` |
| 4 | Looking up, surprised | `242087` | `7f241117-3e88-4e0c-85c3-e9b719667f4d` |
| 5 | Scratching head, puzzled | `972848` | `3a097384-c5b1-4ea1-9b45-95a9b05dfad9` |
| 6 | Riding the rate line | `791519` | `9262443c-9b46-42fa-b396-5b133f649caf` |

Frame 1 is the identity anchor. Any re-run of frames 2-6 should reference job
`9a90b197-...` rather than regenerating from text, or the face drifts.

### Timeline mapping (from the brief)

Walks in on 1 -> 3 -> 2 cycled, holds on 4 while the FOMO statement flashes, cuts to 5 for
the scratch, red question mark pops above him. Frame 6 rides the mortgage-rate curve in the
Rates scene.
