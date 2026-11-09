# Publishing: titles, captions, hashtags, page branding, delivery folder

## Episode title

Give one recommended title, then 4–5 alternatives that each take a different angle:
- **What If + urgent framing** (recommended default): "What If Humans Stopped Dying Tonight?" ☠️🌍
- **Cinematic:** "The Day Humans Stopped Dying"
- **Second person:** "What If You Could Never Die?"
- **Short hook:** "Death Just Stopped. Now What?"
- **Number-led:** "160 Years Without a Single Death"

Use 1–2 emoji at most. Keep "What If" in the recommended title for search and series consistency.

## Caption template (Facebook Reels)

```
What if [question]? [emoji]

[One line naming the change.] [2–3 escalating consequences from the episode, in order.] [Where it ends up.]

[Yes/no question that invites a comment] 👇

#WhatIf #[PageName] #[Topic1] #[Topic2] #3DAnimation #ThoughtExperiment #[Theme] #[Theme]
```

- The first line is all that shows before "…more", so it must be the question.
- A yes/no question at the end gets more comments than an open one.
- Use 6–8 hashtags (Facebook's sweet spot). Offer a rotation list too: #WhatIfScenario #Animation #ScienceFacts #DidYouKnow #Reels #FacebookReels #Hypothetical #Explained #Mindblowing #Earth

## Page branding

Deliver: name, @username suggestions (plus 2 fallbacks; say you can't check availability), category ("Digital creator"), Intro/bio (Facebook limit **101 characters**: count it with code), a longer About, an action button, a colour palette and fonts, and a pinned first-post caption.

- **Names:** original and not close to an existing channel's name (no impersonation). Offer 2–3 backups.
- **Profile picture:** 1080×1080 PNG, cropped to a circle and seen at about 170 px. A single bold mark that reads as small as about 40 px; nothing important in the corners.
- **Cover:** 1640×924 PNG. Desktop shows the middle **1640×624** band (y 150–774); mobile shows roughly the middle **1230 px** width. Keep all text inside both, and keep the lower-left clear (the profile circle overlaps it). Render `?guides` to check.
- Tell the user to upload PNGs (Facebook recompresses JPGs harder).

`assets/template/branding/` renders both from the episode's own 3D scenes, so the brand matches the videos. `brand.js` has two complete looks:
- `?brand=hypothetica`: editorial. Low-poly Earth with a gold orbit ring; serif wordmark (Libre Baskerville) in gold `#FFCF7A` on night navy; the planet bleeds off the right edge of the cover.
- `?brand=earthb`: bold. A split Earth (normal half and recoloured half, with a glowing seam); heavy Inter wordmark with a coral `#FF6A4D` letter badge; the cover is the ocean-city sunset shot.

For a new brand, copy one branch in `brand.js` and edit its HTML text block, colours and camera. `preview.html` makes a rough desktop/mobile page mockup for the user to see (label it a layout preview, not a replica of Facebook's UI). `render.mjs` there writes all PNGs: edit its list of `grab(...)` calls for the new brand's file names.

## Delivery folder

Users often want everything in one folder on their own drive (e.g. `D:\FACEBOOK AUTOMATION`). From a cloud session you usually can't write there: check for a shared computer folder first; otherwise build the folder and a ZIP with `scripts/package_folder.py` and send it, with extraction steps. Layout that worked:

```
<NAME>/
  README.txt                    what's where + page setup steps (Windows line endings)
  01 Videos/                    Episode NN - <Title>.mp4, soundtrack only.m4a
  02 Branding - <Brand A>/      Profile Picture 1080x1080.png, Cover Photo 1640x924.png, previews, safe-area guide, Brand Kit .md
  03 Branding - <Brand B>/
  04 Captions and Hashtags/     Episode NN - Title, Caption, Hashtags.txt
  05 Source Files/              the episode project + branding generator
```

When a title changes later, rename the video file too, and tell the user that re-extracting leaves the old-named file behind for them to delete.
