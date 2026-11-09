# QA: what went wrong last time and how to spot it

Always render a contact sheet of stills (about 2 per scene, at 540×960) and look at it before a full render. A full render costs about an hour; a stills pass costs about 20 s.

```bash
node scripts/render.mjs --project EP --stills 2,6,9,13,... --w 540 --h 960
ffmpeg -y -loglevel error -pattern_type glob -i 'EP/media/stills/t*.png' -vf "scale=225:400,tile=9x2" sheet.png
```

Pick still times in the middle of each caption and near each shot's end, because that's where cameras have moved furthest.

## Symptoms → causes → fixes

| You see | Cause | Fix |
|---|---|---|
| Whole frame washed beige or orange, water looks like sand | `FogExp2` too dense for a high or far camera (the factor grows with the square of distance) | Drop the density to about 0.002 for vast vistas, or darken the fog colour. Debug by setting `scene.fog = null` |
| Milky haze in one corner | Bloom spreading a bright specular/env reflection (water, metal) | Lower the bloom strength (0.3) and raise the threshold (0.85+) for that shot |
| A giant blob or person filling the bottom of frame | Crowd member, walker or bench near the camera's path (walkers move `dz` over time) | Use `skip(x,z)` in `crowdGrid`, and keep walkers' start z clear of the camera at their end position |
| Camera inside a gate post, wall or bench | The final camera key is too close | Pull the last key back. Check the still at the shot's last second |
| Board or screen cropped, or text colliding with the HUD | Vertical 9:16 means the horizontal FOV is only about 29° at fov 50 | Make boards narrower, raise them (so they sit in the top 15–35% of frame), and lower the `lookAt` y |
| Lying patients look like they're sitting | Wrong person `y`/`ry` for `lie` | Feet go at the bed's foot end; `ry` = atan2(−headDir.x, −headDir.z) |
| Scene too foggy to read the set | Interior fog too dense | Interiors: about 0.015 |
| Sticker-like white shards on a planet | Cloud layer from coarse faces | Skip clouds, or use a fine mesh with a high noise threshold |
| `col.getG is not a function` | BufferAttribute has getX/getY/getZ, not getR/getG/getB | Use getX/getY/getZ for colour attributes too |
| Page hangs, no error | An exception inside a module | The renderer prints `[page error]` lines; read them first |

## Rendering gotchas

- Use `scripts/render_parallel.mjs`. Don't improvise chunk-killing with `pgrep -f`: that pattern also matches the bash wrappers, so it kills the wrong processes. If you stop a background task that launched renders, it kills its children too. The parallel script runs each chunk in its own process group and joins them frame-exactly.
- The frame count must equal the sum of `dur` × fps. The parallel script checks each chunk's count with ffprobe before joining.
- ES modules don't load from `file://`; the scripts start their own local HTTP server. When telling the user how to preview, say "run any static server (e.g. `npx http-server`)".
- Fonts are vendored in `fonts/`. Canvas textures need fonts loaded first; `main.js` awaits `document.fonts.load` before building shots.

## Content checks before rendering

- Every caption is one beat, ≤2 lines, and agrees with the counter and time label on screen.
- The numbers in captions follow from the counter's assumptions (e.g. "1 in 8 people over 100" checked against the age distribution). If a figure is speculative, phrase it as such.
- The closing caption is a question to the viewer: that's what drives comments.
- The story is the user's own or an original premise. Don't recreate a specific existing video's script, characters or exact shots; the format (counter + captions + low-poly 3D) is fine to share.
