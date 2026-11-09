# Engine reference

The template (`assets/template/what-if/`) is a complete working episode: "What If Humans Stopped Dying Tonight?", 9 scenes, 65.5 s. Treat its scenes as worked examples to copy from.

## Contents
1. How a frame is made
2. TIMELINE (story, counter, captions)
3. The shot contract
4. lib.js API
5. Scene recipes from the example episode
6. Performance budget

## 1. How a frame is made

`index.html` holds a `<canvas>` (Three.js r170, vendored, no CDN) plus HTML overlay layers: population HUD, caption, vignette, film grain, a black fade layer, and the play button/progress bar (hidden in render mode).

`src/main.js` builds every shot once, then `renderAt(T)` does the following:
- finds the scene that covers `T`
- calls `shot.update(localT, dur)`
- swaps the shot's scene and camera into a single EffectComposer (RenderPass → UnrealBloomPass → OutputPass with ACES tone mapping)
- applies that shot's `bloom` and `exposure`
- updates the overlay (counter, caption fade and blur, fade through black between shots)

Everything is a pure function of time, so `renderAt(12.34)` always gives the same frame. That is what lets the film be rendered frame by frame and in parallel chunks.

URL params: `?render` (no UI; `window.__whatif.renderAt` is used by the renderer), `&w=1080&h=1920`, `?t=30` (player starts at 30 s).

## 2. TIMELINE

```js
{ build: plaza, dur: 8.0, when: 'DAY 0', pop: [8312604118, 8312604152],
  caps: [[0.3, 3.9, 'What if, at midnight tonight, nobody could die?'],
         [4.1, 7.8, 'Not from age. Not from illness. Not from anything.']] },
...
{ build: earth, dur: 7.0, when: 'YEAR 161', pop: [...], caps: [[0.4, 2.9, 'So we leave.'], [3.2, 7.0, 'What would you do with forever?', 'final']] },
```

- `dur`: seconds. 6.5–8 s per shot works well, at about 2 captions per shot.
- `when`: the time label under the counter. Use real units that move forward: DAY 0, DAY 1, WEEK 2, MONTH 3, YEAR 2, YEAR 45…
- `pop: [start, end]`: the counter interpolates across the shot, so it ticks every frame. Make the numbers follow from stated assumptions (births about 134M/yr ≈ 4.3/s; deaths about 62M/yr ≈ 2/s; current population about 8.3B). Within a short shot, a realistic per-second change keeps the digits moving. If the premise is a different count (e.g. "PEOPLE LEFT", "SPECIES LEFT", "TEMPERATURE"), edit the `WORLD POPULATION` label in `index.html`. Keep the counter format because it's the series' signature.
- `caps: [start, end, text, kind?]` in local seconds. Captions fade and blur in. `'final'` makes the closing line large, revealed word by word, and held to the end.
- Captions must fit on two lines at about 2.25% of the frame height: roughly 45 characters per line. Keep each one to a single beat.

The HUD sits at 40–48% of the frame height on the left. Captions sit at about 56%. Compose shots so the action reads around them (keep important props out of the 38–62% band on the left side).

## 3. The shot contract

Each `build()` returns:

```js
return {
  scene, camera,            // THREE.Scene + PerspectiveCamera (aspect 9/16)
  bloom: [strength, radius, threshold],   // e.g. [0.9, 0.55, 0.62]
  exposure: 1.0,
  update(t, dur) { ... },   // t = local seconds; must set the camera and ALL motion from t only
};
```

Start a shot with `shell(bg, fogColor, fogDensity, fov)` from `scenes-a.js`. `bg` can be a color or `gradientTexture([[0,'#top'],[1,'#horizon']])`.

Never use `Date.now()`, `Math.random()` or accumulate state across frames inside `update`. Use `rngFrom(seed)` at build time and compute positions from `t`. Chunks are rendered out of order by separate browsers, so state that carries over between frames breaks the film.

## 4. lib.js API

| Helper | Use |
|---|---|
| `rngFrom(seed)` | Seeded random → `() => 0..1` |
| `clamp, lerp, smooth, easeInOut, easeOut, pick(rng, arr), range(rng, a, b), v3` | Math |
| `cameraRig(camera, [{p:[x,y,z], l:[x,y,z]}, ...])` | Returns `(u, shake, t) => void`. A smooth Catmull-Rom move through the keys; `u` = t/dur |
| `mat(color, opts)` | Flat-shaded MeshStandardMaterial (the low-poly look) |
| `glow(color, k)` | Unlit material at k× brightness; anything above about 1.5 blooms |
| `canvasTexture(w, h, draw)` | `{tex, ctx, redraw(fn)}`. Use for screens, signs and boards; call `redraw` in update for animated screens |
| `gradientTexture(stops)` | Vertical sky gradient |
| `windowTexture(rng, {lit, wall, colors})` + `building(w, h, d, tex, glowK)` | Box buildings with emissive lit windows |
| `neonSign(text, {color, font})` | `{mesh}`, glowing sign plane (aspect w/h); scale and rotate it onto facades |
| `bareTree(rng, {height, depth, color})` | Merged branching tree |
| `starField(rng, n, radius)` | Star points |
| `drift(rng, n, [x0,x1,y0,y1,z0,z1], {fall, sway, color, size})` | Snow, dust, embers; call `pts.userData.update(t)` |
| `crowdGrid(rng, {x0,x1,z0,z1,gap, skip(x,z), make(x,z)})` | People on a jittered grid |
| `new Crowd(people, {phoneGlow})` → `.group`, `.update(t)` | Instanced low-poly people (thousands are fine) |
| `SKIN`, `COATS` | Palettes |

**Person fields:** `x, y, z, ry` (facing; front is +z, so ry=π faces −z), `s` (scale), `body, legs, skin` colours, `hat: 'cone'|'beanie'|'brim'|'hood'|null`, `hatColor`, `phone`, `cane`, `phase`, plus any custom fields, and `pose(p, t)`.

**pose() returns** (all optional, radians and metres):
- `bob`, `dx`, `dz` (body offsets; e.g. walking: `dz: p.dir * t * 0.4`), `turn`
- `lean` (forward bend), `tilt` (side sway), `head` (positive = look down, negative = look up), `headY`
- `aL`, `aR` (arm raised sideways; about 2.6 = overhead), `fL`, `fR` (arm raised forward; 1.0 = reaching to a desk, 2.2 = holding a phone up)
- `sit: true` (legs forward from the hips; set the person's `y` to about seatHeight − 0.72)
- `lie: true` (on the back, head toward local −z; `y` = mattress top + about 0.2)

## 5. Scene recipes in the example episode

| Shot | File / function | Technique worth reusing |
|---|---|---|
| Midnight plaza | `scenes-a.js plaza()` | 2,300-person crowd, countdown screen redrawn per second, firework bursts (Points + additive), confetti instances, flash light |
| Hospital | `hospital()` | Corridor set, beds with lying patients, scrolling ECG texture (`tex.offset.x`), staff walking |
| Cemetery | `cemetery()` | Mist cards, readable sign texture, iron fence instancing, low warm sun |
| City street | `street()` | Building canyon, neon signs that tell the story ("NO VACANCY"), 3,000 walkers, crane-up reveal |
| Price board | `scenes-b.js market()` | LED board drawn on canvas with a dot-matrix overlay, animated chart, scrolling ticker |
| Winter park | `park()` | Seated elderly on benches, canes, snow, lamp lights |
| Ocean cities | `ocean()` | CPU-animated faceted sea with sky env-map reflections, hex platforms, bridges |
| Rocket launch | `launch()` | Flame cones, flickering point light, instanced smoke, accelerating ascent tracked by camera |
| Earth | `earth()` | Noise-coloured low-poly planet, fresnel atmosphere, city lights, ships with trails |

For a new topic, copy the closest shot and change the story props (signs, screens, what the crowd does). The emotional beats usually map onto: a normal moment when the change happens → the first visible effect → institutions react → scale (crowds, cities) → economy (board or screens) → long-term human cost → adaptation or megastructure → exodus or new equilibrium → a reflective closing question.

## 6. Performance budget

Rendering uses software WebGL (SwiftShader) in headless Chromium:
- about 1–3 s per frame at 540×960
- about 3–9 s per frame at 1080×1920

The heaviest shots are big crowds plus lots of facade windows. A 65 s film (1,965 frames) takes about 45–60 min with 3–4 parallel chunks on 4 cores. Keep crowds to about 3,000 people, avoid shadow maps (they're slow in software), and limit each scene to about 6 point lights.
