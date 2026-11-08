# What If… No One Could Ever Die?

A 65-second vertical (9:16) low-poly 3D "What If" short. A world-population counter ticks along while the story jumps forward in time, with italic captions and an original ambient soundtrack.

**Final video:** [`media/what-if-no-one-could-die.mp4`](media/what-if-no-one-could-die.mp4) (1080×1920, 30 fps, AAC stereo, about -16 LUFS). It's ready to post as a Reel, Short or TikTok.

## The story

| # | Time on screen | Shot | Caption |
|---|---|---|---|
| 1 | DAY 0 | Midnight countdown in a packed city square, fireworks and confetti | *What if, at midnight tonight, nobody could die? / Not from age. Not from illness. Not from anything.* |
| 2 | DAY 1 | Hospital ward, every bed full, beds lined up in the aisle | *By morning, every hospital is overflowing. / No one dies. But no one heals any faster.* |
| 3 | MONTH 3 | Misty cemetery behind a gate marked "CLOSED UNTIL FURTHER NOTICE", an idle gravedigger | *Funeral homes close their doors. / The cemeteries go silent.* |
| 4 | YEAR 2 | Shoulder-to-shoulder street at dusk, "NO VACANCY" neon; crane up to reveal the crowd | *Every year, 134 million babies are born. / And nobody ever leaves.* |
| 5 | YEAR 6 | Amber LED food-price board on a trading floor | *Food prices triple. / Clean water becomes worth more than gold.* |
| 6 | YEAR 45 | Snowy park full of very old people on benches | *Bodies still age. They just never stop. / One in eight people is now over 100.* |
| 7 | YEAR 90 | Floating cities on the ocean at sunset | *We build cities on the oceans. / Four in ten people are older than a century.* |
| 8 | YEAR 160 | Night rocket launch watched from a ridge | *Everyone alive on Day 0 is now over 160. / And Earth has run out of room.* |
| 9 | YEAR 161 | Low-poly Earth with ships streaking away | *So we leave. / What would you do with forever?* |

Where the population numbers come from: the count starts at 8.31 billion with zero deaths. Births start at about 134 million a year (today's rate) and are assumed to fall as countries limit births: about 21.3 billion by year 160. The "over 100" figures are the share of people alive on day 0 who would by then be past 100.

## How it's made

- **Three.js (r170)** draws everything live in the browser. The figures are instanced low-poly people (about 3,000 in the crowd shots), with bare trees, buildings with lit windows, waves, smoke and fireworks all generated in code. There are no model files.
- Animation is a pure function of time: `renderAt(t)` always gives the same frame. That lets the film play live and also be rendered frame by frame.
- The overlay (counter, time label, captions, grain, vignette, fades) is plain HTML/CSS over the canvas. It uses Libre Baskerville, Inter and Space Mono, all stored in `fonts/`.
- The soundtrack (`tools/soundtrack.py`) is synthesized with numpy. It has a chord pad that changes with each scene, plus countdown ticks, the midnight boom, fireworks, crowd, ECG beeps, wind, ocean, rocket rumble and whooshes between scenes.

```
what-if/
  index.html            player (click / space to play)
  src/main.js           timeline, captions, population counter, render loop
  src/scenes-a.js       plaza, hospital, cemetery, street
  src/scenes-b.js       market, park, ocean, launch, earth
  src/lib.js            people, trees, textures, particles, camera rigs
  tools/render.mjs      headless Chromium -> ffmpeg frame renderer
  tools/soundtrack.py   score + sound design
  vendor/three, fonts/  local copies, so it works offline
```

## Run / re-render

```bash
cd what-if
npx http-server -p 8080 .          # any static server; ES modules don't load from file://
# open http://localhost:8080 and click to play (?t=30 starts at 30 s)

python3 tools/soundtrack.py         # -> media/soundtrack.wav
ffmpeg -i media/soundtrack.wav -af loudnorm=I=-16:TP=-1.5 -c:a aac -b:a 192k media/soundtrack.m4a
node tools/render.mjs --out media/video-only.mp4                 # 1080x1920 frames -> H.264
node tools/render.mjs --stills 5,20,40 --w 540 --h 960            # quick preview stills
ffmpeg -i media/video-only.mp4 -i media/soundtrack.m4a -c copy -shortest media/what-if-no-one-could-die.mp4
```

The captions, population numbers and shot lengths are in `TIMELINE` in `src/main.js`. If you change a shot length, change `DURS` in `tools/soundtrack.py` to match.

## Credits & licenses

three.js (MIT); Libre Baskerville, Inter and Space Mono (SIL Open Font License). Everything else (story, scenes, music) is original to this project.
