---
name: what-if-3d-shorts
description: Make vertical (9:16) low-poly 3D "What If" animated shorts for Reels, TikTok and Shorts. A live WORLD POPULATION counter and time label tick across cinematic Three.js scenes with italic captions and an original synthesized soundtrack, rendered to a finished 1080x1920 MP4. Also writes the episode title, caption and hashtags, designs matching Facebook page branding (name, bio, profile picture, cover), and packages everything into a ready-to-extract folder/ZIP. Use this whenever someone wants a "what if" video, a hypothetical-scenario or thought-experiment animation, a faceless explainer reel, a 3D animated short about a world-changing premise, the next episode of their What If series, or branding/captions/hashtags for such a page, even if they only share a screenshot of a similar video or just name a topic.
---

# What If 3D Shorts

Turn one hypothetical question into a 60–75 s vertical film. The same Earth changes scene by scene while a counter ticks and captions tell the story. Then help publish it.

**What's bundled**
- `assets/template/what-if/`: a complete working episode ("What If Humans Stopped Dying Tonight?", 9 shots). It's the engine plus examples.
- `assets/template/branding/`: a generator for page branding images.
- `scripts/`: `render.mjs` (stills / single range), `render_parallel.mjs` (full film), `soundtrack.py` (score + SFX), `package_folder.py` (delivery folder + ZIP).
- `references/`:
  - `engine.md`: TIMELINE format, shot contract, lib.js API, scene recipes. Read it before writing scenes.
  - `qa-pitfalls.md`: symptoms and fixes from past renders. Read it before the first stills pass.
  - `publishing.md`: titles, captions, hashtags, Facebook image specs, folder layout. Read it when you get to publishing.

**Requirements:** Node 18+ with Playwright and Chromium, ffmpeg, Python 3 with numpy. Rendering uses software WebGL, so no GPU is needed.

## Workflow

### 1. Pin down the premise (keep it short)

Get the question, the target length, and the page or brand name if there is one. If the user shares someone else's video as inspiration, borrow the format (counter + captions + low-poly 3D + time jumps) but write an original premise and script. Don't recreate that video's story, shots or name; say so in one line and offer a fresh premise in the same spirit.

### 2. Write the story as a TIMELINE

Plan 8–10 shots of 6.5–8 s. A reliable arc:
1. A normal moment when the change hits
2. The first visible effect
3. Institutions react
4. Scale (crowds, cities)
5. Money (screens, boards)
6. Long-term human cost
7. Adaptation or megastructure
8. Climax
9. A reflective question to the viewer

For each shot write: setting, camera move, time label (DAY 0 → YEAR N), counter start/end, and two captions of one beat each (≤45 characters per line).

Work out the counter from stated assumptions and keep the caption figures consistent with it. Viewers check the maths in the comments. Show the user the shot list before building if they seem to care about the story; otherwise proceed.

### 3. Build the episode

```bash
cp -r <skill>/assets/template  <workdir>/episode-NN-<slug>    # gives what-if/ (the film) + branding/
EP=<workdir>/episode-NN-<slug>/what-if
```

Keep `what-if/` and `branding/` side by side under that folder, because the branding generator imports the episode's scenes via `../what-if/`.

- Edit `TIMELINE` in `src/main.js`.
- Write or adapt shots in `src/scenes-*.js`: copy the closest example shot and change its story props (signs, screens, what people do).
- If the counter tracks something other than population, change the `WORLD POPULATION` label in `index.html`.
- Everything must be a pure function of time (see engine.md §3), because chunks render in separate browsers.

### 4. Stills pass (iterate here, not on full renders)

Render about 2 stills per shot at 540×960 and look at a contact sheet. Check framing, readability, the HUD/caption bands and camera collisions using the table in `qa-pitfalls.md`. Fix and repeat until clean. Two or three passes is normal and saves hours.

```bash
node <skill>/scripts/render.mjs --project EP --stills 3,6.5,10,... --w 540 --h 960
```

### 5. Soundtrack

```bash
python3 <skill>/scripts/soundtrack.py --project EP --mood dark \
  --sfx "countdown+fireworks+crowd, monitor, wind, murmur, ticks, wind, ocean, rocket, shimmer"
```

There's one `--sfx` entry per shot (`-` for none). Moods: `dark`, `hopeful`, `tense`. Chords change on every cut automatically, and the result is normalised to −16 LUFS.

You can't hear the result. Check the per-scene RMS it prints (scenes should sit within about 3 dB of each other, apart from intended spikes), and tell the user to listen before posting.

### 6. Full render

```bash
node <skill>/scripts/render_parallel.mjs --project EP --chunks 3      # -> EP/media/final.mp4
```

This takes 45–60 min for about 65 s. Run it in the background and give short progress updates. Afterwards, spot-check frames around the chunk boundaries (the counter should advance smoothly) and confirm the duration and resolution with ffprobe. Then send the MP4 to the user.

### 7. Publish kit

Following `publishing.md`, write:
- a recommended title plus 4 alternatives with different angles
- a caption (question first, consequences, yes/no comment prompt)
- 6–8 hashtags plus a rotation list

### 8. Page branding (when asked)

Name, @username options, category, bio (≤101 characters; count it with code), About, palette and fonts, profile picture 1080×1080 and cover 1640×924. Render them from the episode's own scenes with the `branding/` folder next to `what-if/`: `node <episode folder>/branding/render.mjs` (add `--earthb-only` to render only the second look).

Check the cover's safe areas with `?guides` and show a desktop/mobile preview. If the user wants another option, make it visibly different (type, palette, mark), not just recoloured.

### 9. Deliver

If the user wants everything in one folder on their drive and you can't write there directly, build it with `scripts/package_folder.py`, send the ZIP, and give extraction steps (layout in `publishing.md`). Commit or push the episode project if you're working in a repo.

## Style notes that made Episode 1 work

- **Overlay:** "WORLD POPULATION" in Inter ExtraBold with wide letter-spacing, the number in Libre Baskerville, the time label below it, all left-aligned at 40% of frame height. Captions are Libre Baskerville *italic*, centred at about 56%. Add a slight vignette and film grain, with fades through black between shots.
- **Look:** flat-shaded low-poly shapes, faceless figures, a strong colour mood per shot (warm night, clinical teal, misty dawn, neon dusk, amber monitors, winter blue, sunset gold, rocket orange, deep space). Bloom only on things that should glow.
- **Camera:** slow, motivated moves, such as a push-in, a crane-up reveal, or tilting up to follow a rocket. Every shot moves a little.
- **Ending:** a question to the viewer in large type, held to the end.
