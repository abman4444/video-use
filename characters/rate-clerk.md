# Mr. Prime — current canonical design (the rate clerk)

**This is Mr. Prime.** Same character as `interest-rate-mascot.md`, redesigned. The
top-hat-and-waistcoat build in that file is the RETIRED design — keep it for reference,
do not generate from it. The percent-sign motif carries across the redesign: it was a
watch-chain charm on the old build, it is printed on the eyeshade band on this one.

Built to replace the hand-drawn walker in the reel. Frames are generated on flat white so
they key cleanly onto a timeline.

## Design history

| Build | Status | Anchor |
|-------|--------|--------|
| Top hat, waistcoat, elderly, B&W inked | Retired | `interest-rate-mascot.md`, plate #4 |
| Eyeshade clerk, elderly, balding | Superseded | `9a90b197-...` |
| Eyeshade clerk, young, with hair | Superseded | `82b594db-...` |
| Eyeshade clerk, young, `%` on eyeshade | **CURRENT — use this** | `16404f84-...` |

The `%` is not decoration: it is the percent motif carried over from the retired top-hat
build, where it was a watch-chain charm and a hat pin. Same character, same mark, new body.

---

## Character block (identical in every prompt)

> A tall, thin, clean-shaven young man in his late twenties. Long narrow face, prominent
> hooked nose, smooth unlined youthful features, a full head of thick dark brown hair
> neatly side-parted with a small cowlick standing up at the crown, hair visible below and
> around the headband. He wears a green bank teller's eyeshade, a white shirt with the
> sleeves rolled and black elastic arm garters, a thin dark necktie, grey trousers and
> plain black shoes. He carries a narrow paper ticker tape in one hand. No hat, no glasses,
> no moustache, no cane, no waistcoat, no jacket.

**Optional mark:** a single bold black percent sign printed on the front band of the green
eyeshade, centred on the forehead, in the same hand-inked line weight as the artwork. On
the eyeshade rather than the shirt — head height reads instantly in a reel, and the shirt
position competes with the tie and garters.

The six exclusions are load-bearing — they are what keeps him clear of existing mascots.
Never drop them.

**Age negatives are mandatory.** "Young man" alone loses to the eyeshade-clerk archetype,
which models strongly associate with an older man. Always append: *not balding, no bald
patch, no receding hairline, no grey hair, no white hair, not elderly, no wrinkles, no age
lines.*

**When adding the `%`, keep the rest of the no-text rule.** Use: *apart from the single
percent sign on the eyeshade there is no text anywhere in the image, no letters, no words,
no numbers, no digits, no lettering on the shirt, no writing on the ticker tape.*

**Never reference an old-build image when changing age or hair.** The reference overrides
the exclusions and drags the grey and the bald crown back in. Generate the new anchor from
text, then reference that.

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

### FINAL SET — young build with `%` (anchor `16404f84`, seed `665653`)

This is the deliverable. All `seedream_v5_pro`, 2k, every frame referenced off the `%`
anchor. 7/7 completed, 0 failed.

| # | Frame | AR | Size | Seed | Job ID |
|---|-------|----|------|------|--------|
| 1 | Walk, contact (anchor) | 3:4 | 1760x2352 | `665653` | `16404f84-039f-4344-8a40-3c8c493c2c28` |
| 2 | Walk, passing | 3:4 | 1760x2352 | `538806` | `80329926-64a9-44ea-8b31-d6fcee637b10` |
| 3 | Walk, down | 3:4 | 1760x2352 | `749096` | `e310b0dd-f707-4125-ba2e-b6ef3b1b6f3a` |
| 4 | Looking up, surprised | 3:4 | 1760x2352 | `830509` | `0c4d5715-451a-4922-b94a-4e2b5500cb61` |
| 5 | Scratching head, puzzled | 3:4 | 1760x2352 | `383960` | `937e932d-8f93-425b-8293-c90b9920618a` |
| 6 | Riding the rate line | 3:4 | 1760x2352 | `100468` | `1deaac66-d676-48e1-bfb9-1fb9cf99ca7a` |
| 7 | Turnaround | 16:9 | 2720x1536 | `139224` | `f69fd830-84cb-425f-a61b-e88d0dde19de` |

**Per-pose occlusion clauses.** With a mark on the eyeshade, three poses needed the hand or
head steered so the `%` stays readable — worth keeping if these are ever regenerated:
- Frame 4: *the percent sign on the band riding up with the eyeshade and still clearly legible*
- Frame 5: *his hand kept clear of the eyeshade band so the percent sign is not covered*
- Frame 6: *the other raised to the side of his eyeshade without covering the percent sign*
- Frame 7 rear view: *the plain eyeshade strap across it, no percent sign visible from behind*

### Superseded — young build without the mark (anchor `82b594db`, seed `303336`)

All `seedream_v5_pro`, 2k, referenced off the young anchor. 18 credits. These do NOT carry
the `%` mark.

| # | Frame | AR | Seed | Job ID |
|---|-------|----|------|--------|
| 1 | Walk, contact (anchor) | 3:4 | `303336` | `82b594db-6326-4e12-bd29-70c145a69463` |
| 2 | Walk, passing | 3:4 | `573763` | `33007e04-4872-464d-9093-de5164d7a4bd` |
| 3 | Walk, down | 3:4 | `980218` | `368c0722-c8bc-4108-ba70-b66e7532cce1` |
| 4 | Looking up, surprised | 3:4 | `981128` | `e1bcc3dc-ca59-4485-8739-7d10343e5e77` |
| 5 | Scratching head, puzzled | 3:4 | `78572` | `036a1540-a460-43fc-9d37-c933004478e9` |
| 6 | Riding the rate line | 3:4 | `180774` | `573289ff-d3ce-454e-a9b6-854bceac7aaa` |
| 7 | Turnaround | 16:9 | `506575` | `4d475e1e-3e9f-4e43-8b8c-a3979ddaf7fd` |

### Cost lesson

Each change to the character after a set is underway invalidates the whole set, because
frame 1 anchors every other frame. This character went through four anchors and three full set
runs — roughly 57 credits on versions now superseded, against 21 for the set that shipped.
Lock the design on a single 3-credit anchor first, approve it, then run the set once.

### Retired set — elderly build (anchor `9a90b197`, seed `144478`)

Superseded by the young build. Kept only so the job IDs are recoverable.

| # | Frame | Seed | Job ID |
|---|-------|------|--------|
| 1 | Walk, contact | `144478` | `9a90b197-7c17-4262-86e5-26eefb849ee9` |
| 2 | Walk, passing | `876835` | `0996e001-bb81-4d17-be81-58decda5742b` |
| 3 | Walk, down | `904504` | `f627c339-3e54-4c20-a7ee-98c3c72d254f` |
| 4 | Looking up | `242087` | `7f241117-3e88-4e0c-85c3-e9b719667f4d` |
| 5 | Scratching head | `972848` | `3a097384-c5b1-4ea1-9b45-95a9b05dfad9` |
| 6 | Riding the rate line | `791519` | `9262443c-9b46-42fa-b396-5b133f649caf` |
| 7 | Turnaround | `391913` | `1f16176d-f389-4a14-a8d8-4d5f9571b18d` |

All runs at 2k. Frame 1 is always the identity anchor: generate it alone, approve it,
then reference it for every other frame or the face drifts.

### Timeline mapping (from the brief)

Walks in on 1 -> 3 -> 2 cycled, holds on 4 while the FOMO statement flashes, cuts to 5 for
the scratch, red question mark pops above him. Frame 6 rides the mortgage-rate curve in the
Rates scene.
