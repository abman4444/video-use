# Getting started

A plain-English guide to actually using this on your own footage. No jargon.

For what the tool is and how it works under the hood, see [`README.md`](./README.md).
For the full editing rules, see [`SKILL.md`](./SKILL.md).

---

## What this is

You put video files in a folder, talk to an AI in plain English, and get an edited
video back. There are no menus, no timeline to drag, no settings to learn.

## What you need

- A Mac, Linux machine, or PC you can open a terminal on
- [Claude Code](https://claude.com/claude-code) (or Codex, or another agent with shell access)
- An **ElevenLabs API key** — this is the one thing you have to supply. It turns
  speech into text so the tool knows where the words start and stop, which is how
  it knows where it's safe to cut. Get one at
  [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys).

**This runs on your own computer**, where your footage is. Not in a browser, and not
in a cloud session.

---

## One-time setup

Open a terminal, start your agent, and paste this:

```text
Set up https://github.com/abman4444/video-use for me.

Read install.md first to install this repo, wire up ffmpeg, register the skill
with whichever agent you're running under, and set up the ElevenLabs API key —
ask me to paste it when you need it. Then read SKILL.md for daily usage, and
always read helpers/ because that's where the editing scripts live. After
install, don't transcribe anything on your own — just tell me it's ready and
wait for me to drop footage into a folder.
```

It handles the rest and asks you for the API key when it needs it.

> **Using a fork?** Put *your* repository URL in that prompt. If you clone someone
> else's copy you get their version, not yours.

Prefer to do it by hand? [`install.md`](./install.md) has every step.

---

## Using it

**1. Put your video files in a folder.** Anywhere. They can be raw camera files —
multiple takes, messy, unedited.

```
~/Videos/my-project/
├── take1.mp4
├── take2.mp4
└── take3.mp4
```

**2. Open a terminal in that folder and start your agent.**

```bash
cd ~/Videos/my-project
claude
```

**3. Say what you want.**

> edit these into a 2 minute intro video

That's the whole interface.

---

## What happens next

It will not start cutting immediately. The conversation goes roughly like this:

**It looks at your footage.** Checks each file and transcribes the speech. The first
time this takes a few minutes. After that it's cached — it never re-transcribes a
file that hasn't changed.

**It asks you questions.** What's this for? How long? What feel? Anything that must
stay in? Anything that must come out? The questions depend on what it found in your
footage — there's no fixed checklist.

**It proposes a plan in plain English, and waits.** Something like:

> *"Three takes of the same intro. Take 2 is the cleanest — no false start, better
> energy. I'll open on the hook at 0:14, cut the four filler pauses, warm cinematic
> grade, captions in 2-word chunks. Roughly 1:50."*

You say yes, or tell it what to change. **It won't touch the edit until you approve.**

**It builds it and checks its own work** before showing you anything — looking for
visual jumps at cuts, audio pops, captions hidden behind graphics.

**You give feedback in plain English.**

> make the opening tighter and lose the bit about pricing

And it re-cuts.

### Things it does without being asked

- Cuts out *ums*, *uhs*, false starts, and dead air between takes
- Fades the audio 30ms at every cut so you never hear a pop
- Colour-grades each clip
- Burns in subtitles, if you want them

---

## Where your files end up

Everything goes in an `edit/` folder next to your footage.
**Your original files are never modified.**

```
~/Videos/my-project/
├── take1.mp4            ← untouched
├── take2.mp4            ← untouched
├── take3.mp4            ← untouched
└── edit/
    ├── final.mp4        ← your finished video
    ├── preview.mp4      ← faster, lower quality, for checking
    ├── project.md       ← notes, so next session remembers
    ├── edl.json         ← the cut decisions
    └── assets.json      ← the approved look, if you used graphics
```

---

## Coming back later

Just start the agent in the same folder again and say what you want next.

It reads `project.md`, checks that everything is still where it expects, and tells
you what you did last time before asking how to continue. It won't re-transcribe and
it won't start over.

If you moved or renamed your source files, it says so up front rather than failing
halfway through a render.

---

## Asking for changes

Ask in plain English. Some things worth knowing:

**Be specific about what should stay the same.** "Make the intro punchier, keep
everything else exactly as it is" works better than "make it punchier" — the second
invites it to change things you were happy with.

**Your old versions are never overwritten.** Ask for a change and you get a new file
next to the old one, so you can compare and go back.

**Ask for a vertical version** and it re-lays-out each scene for the taller frame,
rather than just cropping the sides off.

---

## If something goes wrong

**"Skill not found" / the agent doesn't know what to do.** The skill isn't registered.
Tell your agent: *"check that video-use is symlinked into your skills directory."*

**It asks for an API key every time.** The key belongs in `.env` at the root of the
video-use repo — not in your videos folder.

**"ffmpeg not found".** That's the engine that does the actual video work.
`brew install ffmpeg` on Mac, `sudo apt-get install ffmpeg` on Ubuntu.

**Transcription is slow the first time.** Expected. It's cached after that.

**You want animated graphics.** Those need Node.js 22 or newer, installed the first
time a project actually needs them.

Anything else: paste the error to your agent and ask it to fix it. It has the repo.
