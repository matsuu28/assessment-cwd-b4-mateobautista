// Timeline, overlay and render loop for Episode 2: "What If Every Insect Disappeared Tonight?"
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { market } from './scenes-b.js';
import { meadow, orchard, forest, supermarket, handPollination, verticalFarm, rationLine, quietMeadow } from './scenes-ep2.js';

const fruitBoard = () => market({
  title: 'FRUIT & VEG INDEX', code: 'FVX', codeX: 680, from: 212.4, to: 486.3, axis: [0, 150, 300, 450],
  sub: 'APPLES  COCOA  COFFEE  ALMONDS  TOMATOES', color: '#ff7a3a', hi: '#ffc58f',
  left: [['APPLES', '412%', 1], ['COCOA', '633%', 1], ['COFFEE', '521%', 1], ['ALMONDS', '390%', 1], ['HONEY', '-100%', 0], ['YIELDS', '-62%', 0]],
  right: [['BERRIES', '707%', 1], ['TOMATO', '344%', 1], ['AVOCADO', '455%', 1], ['MELON', '298%', 1], ['WHEAT', '4%', 1], ['RICE', '3%', 1]],
  ticker: 'BERRIES ▲707.2%   COCOA ▲633.0%   COFFEE ▲521.4%   AVOCADO ▲455.8%   APPLES ▲412.6%   ALMONDS ▲390.1%   WHEAT ▲4.1%   ',
});
import { clamp, smooth, lerp } from './lib.js';

/* ---------- the story ---------- */
// pop: world population at the start/end of each shot. Normal growth (~70M/yr net) continues for
// about 3 years on stored food and wind-pollinated staples, then malnutrition pushes it down.
export const TIMELINE = [
  { build: meadow, dur: 8.0, when: 'DAY 0', pop: [8312604118, 8312604136], caps: [[0.3, 3.7, 'What if, at dawn tomorrow, every insect vanished?'], [3.9, 7.8, 'All ten quintillion of them. Gone.']] },
  { build: orchard, dur: 7.5, when: 'WEEK 1', pop: [8313995240, 8313995257], caps: [[0.3, 3.6, 'Three in four crop types need pollinators.'], [3.8, 7.3, 'Orchards bloom… and nothing comes.']] },
  { build: forest, dur: 7.0, when: 'MONTH 2', pop: [8324287415, 8324287431], caps: [[0.3, 3.3, "Songbirds can't feed their chicks."], [3.5, 6.8, 'By autumn, the forests fall silent.']] },
  { build: supermarket, dur: 7.5, when: 'MONTH 6', pop: [8347406932, 8347406949], caps: [[0.3, 3.5, 'Apples, coffee, chocolate: sold out.'], [3.7, 7.3, 'Wheat, rice and corn survive. Wind pollinates them.']] },
  { build: fruitBoard, dur: 7.0, when: 'YEAR 1', pop: [8381650210, 8381650226], caps: [[0.3, 3.3, 'Fruit and vegetable prices explode.'], [3.5, 6.8, 'Vitamins become a luxury.']] },
  { build: handPollination, dur: 7.0, when: 'YEAR 3', pop: [8431902554, 8431902561], caps: [[0.3, 3.3, 'Millions are hired to pollinate by hand.'], [3.5, 6.8, 'One flower at a time.']] },
  { build: verticalFarm, dur: 7.0, when: 'YEAR 10', pop: [8296118430, 8296118416], caps: [[0.3, 3.3, 'Robot pollinators. Indoor mega-farms.'], [3.5, 6.8, 'Still not enough for 8 billion people.']] },
  { build: rationLine, dur: 7.5, when: 'YEAR 30', pop: [7618440291, 7618440261], caps: [[0.3, 3.6, 'Diets shrink to bread, rice and corn.'], [3.8, 7.3, 'Hunger becomes part of everyday life.']] },
  { build: quietMeadow, dur: 7.5, when: 'YEAR 50', pop: [7104227906, 7104227891], caps: [[0.4, 3.3, 'They were tiny. They held up the world.'], [3.6, 7.5, 'Still think insects are useless?', 'final']] },
];
let acc = 0;
for (const s of TIMELINE) { s.start = acc; acc += s.dur; }
export const DURATION = acc;

/* ---------- renderer ---------- */
const canvas = document.getElementById('gl');
const params = new URLSearchParams(location.search);
const RENDER_MODE = params.has('render');
const W = Number(params.get('w') || 1080), H = Number(params.get('h') || 1920);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: RENDER_MODE, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1, 0.5, 0.7);
composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new OutputPass());
composer.setSize(W, H);

/* ---------- overlay ---------- */
const $ = (id) => document.getElementById(id);
const popEl = $('pop'), whenEl = $('when'), capEl = $('cap'), fadeEl = $('fade'), grainEl = $('grain'), hudEl = $('hud');
const fmt = new Intl.NumberFormat('en-US');
let lastCap = null;

function overlay(T, s, local) {
  const u = clamp(local / s.dur);
  const pop = Math.floor(lerp(s.pop[0], s.pop[1], u));
  popEl.textContent = fmt.format(pop);
  whenEl.textContent = s.when;
  hudEl.style.opacity = String(smooth((T - 0.4) / 0.8));

  let text = '', a = 0, final = false;
  for (const [a0, a1, txt, kind] of s.caps) {
    if (local >= a0 - 0.01 && local <= a1 + 0.01) {
      text = txt; final = kind === 'final';
      a = smooth((local - a0) / 0.35) * (final ? 1 : smooth((a1 - local) / 0.3));
    }
  }
  if (text !== lastCap) {
    capEl.innerHTML = text.split(' ').map((w, i) => `<span style="--i:${i}">${w}</span>`).join(' ');
    lastCap = text;
  }
  capEl.classList.toggle('final', final);
  capEl.style.opacity = String(a);
  capEl.style.transform = `translate(-50%, ${(1 - a) * 0.6}vh)`;
  capEl.style.filter = `blur(${(1 - a) * 3}px)`;
  // the closing line reveals word by word
  const finalStart = final ? s.caps.find((c) => c[3] === 'final')[0] : 0;
  [...capEl.children].forEach((sp, i) => { sp.style.opacity = final ? String(smooth((local - finalStart - i * 0.14) / 0.5)) : '1'; });

  // fade through black between shots, longer fade out at the very end
  const isLast = s === TIMELINE[TIMELINE.length - 1];
  const fin = s === TIMELINE[0] ? 0.6 : 0.3, fout = isLast ? 1.2 : 0.3;
  const black = Math.max(1 - smooth(local / fin), 1 - smooth((s.dur - local) / fout));
  fadeEl.style.opacity = String(black);
  grainEl.style.backgroundPosition = `${Math.floor(T * 24 * 37) % 200}px ${Math.floor(T * 24 * 53) % 200}px`;
}

/* ---------- build + render ---------- */
let built = false;
async function init() {
  await Promise.all([
    document.fonts.load('400 40px "Libre Baskerville"'), document.fonts.load('italic 400 40px "Libre Baskerville"'),
    document.fonts.load('700 40px "Space Mono"'), document.fonts.load('800 40px Inter'), document.fonts.load('600 40px Inter'),
  ]);
  for (const s of TIMELINE) s.shot = s.build();
  // warm up: compile every scene once
  for (const s of TIMELINE) { s.shot.update(0.01, s.dur); renderer.compile(s.shot.scene, s.shot.camera); }
  built = true;
}

export function renderAt(T) {
  T = clamp(T, 0, DURATION - 1e-3);
  const s = TIMELINE.find((x) => T >= x.start && T < x.start + x.dur) || TIMELINE[TIMELINE.length - 1];
  const local = T - s.start;
  const shot = s.shot;
  shot.update(local, s.dur);
  renderPass.scene = shot.scene; renderPass.camera = shot.camera;
  [bloom.strength, bloom.radius, bloom.threshold] = shot.bloom;
  renderer.toneMappingExposure = shot.exposure;
  composer.render();
  overlay(T, s, local);
}

/* ---------- sizing ---------- */
function fit() {
  const stage = $('stage');
  const vw = window.innerWidth, vh = window.innerHeight;
  const h = RENDER_MODE ? vh : Math.min(vh, vw * 16 / 9);
  stage.style.height = `${h}px`; stage.style.width = `${h * 9 / 16}px`;
  stage.style.setProperty('--u', `${h / 100}px`);
}
window.addEventListener('resize', fit); fit();

window.__whatif = { renderAt, DURATION, TIMELINE, ready: init() };

/* ---------- interactive player ---------- */
if (!RENDER_MODE) {
  const audio = $('audio'), playBtn = $('play'), bar = $('bar');
  let playing = false, t0 = 0, offset = Number(params.get('t') || 0);
  const now = () => (audio && !audio.error && audio.readyState > 0 && !audio.paused ? audio.currentTime : offset + (playing ? (performance.now() - t0) / 1000 : 0));
  window.__whatif.ready.then(() => { renderAt(offset); playBtn.classList.add('ready'); });
  const start = () => {
    if (!built) return;
    playBtn.classList.add('hidden');
    if (offset >= DURATION - 0.05) offset = 0;
    playing = true; t0 = performance.now();
    if (audio) { audio.currentTime = offset; audio.play().catch(() => {}); }
  };
  const pause = () => { offset = now(); playing = false; audio && audio.pause(); playBtn.classList.remove('hidden'); };
  $('stage').addEventListener('click', () => (playing ? pause() : start()));
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); playing ? pause() : start(); } });
  const loop = () => {
    if (built && playing) {
      const T = now();
      if (T >= DURATION) { offset = DURATION; pause(); } else renderAt(T);
      bar.style.width = `${(T / DURATION) * 100}%`;
    }
    requestAnimationFrame(loop);
  };
  loop();
}
