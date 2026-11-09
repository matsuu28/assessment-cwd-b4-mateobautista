# Hypothetica: Facebook Page Kit

## Name & handle

| Field | Use |
|---|---|
| **Page name** | Hypothetica |
| **Username** | @hypothetica (if taken: @hypothetica.whatif, @hypotheticaanimated) |
| **Category** | Digital creator (secondary: Video creator, Education) |
| **Action button** | Follow (later: "Watch video", linking to the newest episode) |

The name is short for "hypothetical": every video takes one hypothetical question and plays it out across the whole world. It's original, easy to say, and doesn't lean on any existing channel's name.

Other names if Hypothetica is taken: **Ripple World**, **The Day After If**, **Earth, Reimagined**.

## Bio / Intro (101 characters max)

> What if the world changed overnight? 🌍 3D animated What Ifs, backed by real numbers.

Shorter options:
- One question. The whole world changes. 🌍 New 3D What If every week.
- Tiny questions. World-sized answers. 3D animated What Ifs. 🌍

## About (longer description)

> Hypothetica turns one simple question into a whole-world story. What if no one could die? What if the Moon vanished? What if every car stopped at once?
>
> Each short follows the ripple effect day by day and year by year, with a live world-population counter and real-world numbers behind every step. It's low-poly 3D, cinematic, and under 90 seconds.
>
> New What If every week. Comment the question you want answered next.

## Images

| File | Size | Notes |
|---|---|---|
| `hypothetica-profile.png` | 1080×1080 | Low-poly Earth with one golden orbit and a traveller on it. Facebook crops it to a circle; everything important sits inside that circle. |
| `hypothetica-cover.png` | 1640×924 | Desktop shows the middle 1640×624 band; mobile shows roughly the middle 1230 px width. The title sits inside both (see `cover-safe-areas.png`). |
| `preview-desktop.png`, `preview-mobile.png` | — | Rough layout previews of how the profile image and cover sit together. |

Upload the PNGs as they are. Facebook recompresses JPGs harder.

## Look & feel (keep every video consistent)

| | |
|---|---|
| Night navy | `#02040C` (backgrounds) |
| Signal gold | `#FFCF7A` (accents, "tica", the orbit) |
| Ocean blue | `#2C6FA3` · land green `#5B7F3A` · land tan `#8A7A5A` |
| Headline / numbers | Libre Baskerville (regular + *italic*) |
| Labels | Inter ExtraBold, ALL CAPS, wide letter-spacing (e.g. `WORLD POPULATION`) |
| Signature element | The live **WORLD POPULATION** counter + time label (`DAY 0`, `YEAR 45`) in every video |

## First post (pin it)

> **What if humans stopped dying tonight?** ☠️🌍
>
> No illness, no accidents, no old age. Just… forever. Here's how the world changes, from Day 0 to Year 161. 🌍
>
> Would you take the deal? 👇
>
> #WhatIf #Hypothetica #3DAnimation #Immortality #ThoughtExperiment #Science #Future

## Post caption template

> **What if [question]?** [one emoji]
>
> [One-line hook that names the first consequence.] Here's what happens, from Day 0 to [end point]. 🌍
>
> [Question that invites a comment, e.g. "Would you survive?" or "What should we do?"] 👇
>
> #WhatIf #Hypothetica #3DAnimation #[Topic] #ThoughtExperiment

## Regenerate the images

```bash
node branding/render.mjs
```

The images are rendered from the same Three.js Earth used in the film (`what-if/src/scenes-b.js`). Change the text in `branding/brand.js`.
