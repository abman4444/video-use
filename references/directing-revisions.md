# Directing an agent through revisions

Notes distilled from Sanji Nai-Chien, *"GPT-6 Astra: Automate Your Entire DaVinci Resolve
Pipeline"* (19:10, 2026-09-18) — ChatGPT/Codex driving DaVinci Resolve Studio 21.1 through
three motion-design jobs: a Vox-style explainer, a two-scene animated character, and a
product ad built from one photo.

The video is not about a tool. It is about **how you brief and re-brief an agent doing
creative work**, which is the part `SKILL.md` covers least. Everything below is method,
not DaVinci trivia.

---

## The thesis

> "The part that matters here is what we can do with that project afterwards. On a real
> job, you always get feedback."

The first generation is never the deliverable. Timing changes, someone wants another
scene, the same animation suddenly has to work on a phone. So the thing to optimize is
**how cheap the second version is**, not how good the first one looks.

Consequence: every brief he writes ends with some form of *"keep everything editable."*
He never asks for a rendered file. He asks for a project whose decisions can still be
moved. In our terms: keep `edl.json`, the per-slot animation sources, and the grade chain
as the artifacts — `final.mp4` is a build output, not the work.

## 1. Verify the connection before you brief

Wire the agent to the **live project**, then prove the link with a read-back before asking
for anything:

> "Use the DaVinci Resolve integration to tell me which project is currently open."

A read-only question whose answer he can check by looking at his own screen. Only then does
the first real job go in. Cheap, and it fails loudly instead of silently producing work in
the wrong place.

Our equivalent: `ffprobe` every source and report what you found *before* proposing a
strategy. Never start editing against an inventory you haven't shown the user.

## 2. Brief structure

Every one of his three briefs has the same six parts:

| Part | Example |
|---|---|
| Job + format | "Create an editorial-style animation for a YouTube video" |
| Visual reference | "the feel of a Vox-style explainer — cutout imagery, bold typography, depth, connected transitions" |
| Success constraint | "make the central idea clear **without narration**" |
| Hard duration | "15 seconds" / "12 seconds" / "5 seconds" |
| Open creative slot | "choose one simple everyday idea and explain it visually" |
| Editability mandate | "build the animation with editable elements in Fusion" |

The pattern worth stealing: **the job is specific, the subject is open.** He deliberately
does not pick the topic, the character, or the product concept — because an open slot is
what makes the first version worth judging. But the format, the duration, and the
success test are nailed down, so there is something concrete to judge it against.

The success constraint is doing the most work. "Works without narration" and "works without
dialogue" are not style notes — they are pass/fail tests the agent can self-check against,
and he explicitly asks it to ("check the explanation and build the animation"). Give every
brief one of these.

## 3. The revision template — stays / changes / timing

The single most transferable technique in the video:

> "I'm splitting this request into what stays, what changes, and the timing."

A real one, verbatim:

> "Make another version of the second scene. Add a brief moment of anticipation before the
> main action and then make the reaction more expressive. **Keep the character, setting,
> camera, main action, and story outcome.** Make sure to fit it into the same five seconds.
> Adjust the sound and save it separately."

Four things to copy:

1. **The preserve-list is explicit and long.** Naming five things that stay is what keeps
   the revision from drifting into a rewrite. His own note: *"I'm being super specific about
   what stays the same because it keeps the revision focused."*
2. **Duration is restated even when unchanged.** See §4.
3. **Dependent tracks are named.** "Adjust the sound" — if an impact moves, its sound
   effect has to move with it. Nothing downstream re-syncs itself.
4. **"Save it separately."** Never overwrite a version you might want back.

## 4. Revisions hold the runtime

> "In a real edit, I might already have the next shot coming in at that point. So the
> revised graphic needs to fit the same space."

The explainer stays at 15s across both versions; the character take stays at 5s. A revision
that changes the runtime silently breaks whatever surrounds it.

The corollary he states out loud while reviewing: **"the extra time has to come from
somewhere."** When you lengthen a hold inside a fixed duration, go find what got shortened
and check that it still reads. That is the actual review job, not "does the new bit look
good."

## 5. Compare versions, and name the criterion first

He never judges a revision alone. He plays both, and he says what he is watching for
*before* he watches:

> "Follow that main explanatory moment and then watch how each version moves into the
> ending."

> "Watch that extra pause before the action and how much time the final reaction gets."

Then the decision rule is stated in one line — *"I choose the version that makes the
complete explanation easiest to follow."*

For us: self-eval already samples cut boundaries. When there are two candidate versions,
extract the **same** timestamps from both and state the comparison criterion in the message
that presents them. Don't hand the user two videos and "which do you prefer?"

## 6. Consistency = separate the design from the situation

The recurring-character workflow:

> "Establish the design, build another scene from it, and direct the performance without
> asking for a new character every time."

Scene 2 keeps character + setting, changes only the action, in 5 seconds. Design is
approved once and then treated as fixed input; each new brief only spends its creative
budget on the situation.

Generalizes directly: approve a palette/font/grade once, then every later slot inherits it
as a stated constant rather than being re-proposed. A revision that re-opens a settled
decision is a bug.

## 7. Split generation from assembly

For the ad:

> "Before creating anything, I separate the job into two parts. First we need the supporting
> visuals — a background and two short clips. Then we need an edit that brings those assets
> together with the product, typography and sound."

Assets get reviewed on their own terms before any edit is built. His actual QC criteria:

- Lighting and color must **belong to the same campaign** across every asset.
- Composition must leave room for the product and for readable text.
- *"A background can look great on its own and still be too busy behind the label."*

That last one is the whole point of a separate asset-review pass — an asset is judged in the
context it will be used in, not in isolation. Same reason we render animation slots to their
own files and check them before compositing.

## 8. Carry context across sessions in project notes

Before switching to a new chat he asks the agent to **save the connection instructions and
the project name into the project notes**, and opens the next chat with:

> "Read the project notes, reconnect to the same Resolve project, and confirm Higgsfield is
> available in this channel."

This is exactly what `project.md` is for, and it validates the design. Worth adopting the
detail we're missing: the notes should carry **how to re-establish the environment**, not
just what was decided. Project name, source paths, API/plugin availability, then decisions.

## 9. Reformatting is recomposition, not cropping

> "A product placed beside a title in the horizontal frame may need to sit above it in the
> vertical version."

His 9:16 brief, which is a good checklist for any vertical deliverable:

- Product readable **within the first second** (someone is scrolling)
- **Recompose each scene** for the frame — not a center-crop
- Branding and final text stay readable at small size
- **Understandable without sound**
- **Keep the soundtrack** for viewers who turn it on
- Save alongside the horizontal versions

And the review method: **watch it muted first**, check the pictures and typography carry the
message alone, *then* bring sound back and replay the opening. Two separate passes, because
they test two different failure modes.

## 10. The deliverable is a set

> "For client work, these are three separate deliverables: the original commercial, an
> alternative opening, and a version for mobile. Each one starts with the same product and
> supporting material."

Variants are the product, not clutter. Keep them all in the project; name them for what
distinguishes them.

## 11. Save the workflow as a skill — separate from the project

> "I'm keeping the actual DaVinci project alongside the instructions. The project contains
> the work itself, and the skill describes how to approach another job that's just like it."

What he asks the saved skill to cover:

- visual style and pacing
- project structure and how revisions are organized
- **which source files the human supplies** vs. which assets get generated
- how to preserve the established look before making changes

And the rule against merging them: **one skill per job type.** A recurring character needs
design consistency; an explainer needs a clear visual sequence; a product ad needs accurate
branding and layouts that work in both orientations. Different requirements, different
starting points.

## 12. Cost accounting, honestly

> "The cost comparison needs to cover the complete job — the generated assets, the software,
> and the time spent reviewing and correcting the edit. **Every unused generation still
> belongs in that total.** The useful comparison is what it takes to reach the versions
> you're actually going to deliver. That includes the feedback after the first render."

If we ever quote a cost or a time saving, it counts discarded takes and review time.

## 13. Division of labor

> "Astra handles the build and the revisions, whereas I set the direction and decide what's
> actually ready to publish."

And where to start:

> "I'd start with a short graphic that has a clear place in the edit. Give it the brief,
> adjust the timing to the narration, and keep the project for the next change. That's a
> manageable piece of work to judge from beginning to end."

One slot, one clear place in the edit, one revision cycle. Judge the loop before scaling it.

---

## Animation craft notes

Scattered through the video, worth keeping:

- **Establish personality before the event.** *"The way it stands, approaches the task, or
  pauses before acting can establish the confidence we're looking for."*
- **Vary the pacing or the beat disappears.** *"If everything happens at the same exact
  speed, the important moment can disappear into the rest of the movement."*
- **Anticipation before action** makes the reaction read — a brief pause so the viewer
  expects something before it happens.
- **Give the reaction time to land.** The punchline needs its own space after it happens.
- **Image + label together needs a longer hold.** The viewer has to read the words *and*
  connect them to what they are seeing — two operations, not one.

These agree with `SKILL.md`'s "preserve peaks / extend past punchlines" and the
"never parallel-reveal independent elements" rule, from the animation side rather than the
cutting side.
