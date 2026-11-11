// Episode 2: "What If Every Insect Disappeared Tonight?"
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  rngFrom, clamp, lerp, smooth, easeOut, pick, range, cameraRig, mat, glow, canvasTexture,
  gradientTexture, spriteTexture, windowTexture, building, neonSign, drift, Crowd, crowdGrid, SKIN, COATS,
} from './lib.js';
import { shell } from './scenes-a.js';

/* ---------- shared builders ---------- */
const matCache = new Map();
const cmat = (c, o) => { const k = c + JSON.stringify(o || {}); if (!matCache.has(k)) matCache.set(k, mat(c, o)); return matCache.get(k); };

function canopyTree(rng, { h = 4, r = 1.6, leaf = ['#4f7a3a'], trunk = '#5a4030', blobs = 3 } = {}) {
  const g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.09, r * 0.15, h * 0.62, 6), cmat(trunk)); tr.position.y = h * 0.31; g.add(tr);
  for (let i = 0; i < blobs; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * range(rng, 0.62, 1), 0), cmat(pick(rng, leaf)));
    b.position.set(range(rng, -0.5, 0.5) * r, h * 0.62 + range(rng, 0, 0.55) * r, range(rng, -0.5, 0.5) * r);
    b.rotation.set(rng() * 3, rng() * 3, 0); b.scale.y = range(rng, 0.8, 1.05); g.add(b);
  }
  return g;
}

function ground(rng, scene, color, size = 160, z = -40) {
  const gg = new THREE.PlaneGeometry(size, size, 50, 50); gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position; for (let i = 0; i < gp.count; i++) gp.setY(i, Math.sin(gp.getX(i) * 0.21) * 0.15 + Math.cos(gp.getZ(i) * 0.17) * 0.18 + range(rng, -0.05, 0.05));
  const m = new THREE.Mesh(gg.toNonIndexed(), mat(color)); m.position.z = z; scene.add(m); return m;
}

function tufts(rng, scene, n, box, colors, h = 0.4) {
  const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, h, 3), mat('#ffffff'), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    q.setFromEuler(e.set(range(rng, -0.3, 0.3), rng() * 6, range(rng, -0.3, 0.3)));
    m4.compose(p.set(range(rng, box[0], box[1]), h * 0.35, range(rng, box[2], box[3])), q, s.setScalar(range(rng, 0.6, 1.5)));
    im.setMatrixAt(i, m4); im.setColorAt(i, c.set(pick(rng, colors)));
  }
  scene.add(im); return im;
}

function flowers(rng, scene, n, box, colors, clear = null) {
  const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 0), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.12 }), n);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.01, 0.012, 1, 3).translate(0, 0.5, 0), mat('#4c6b2c'), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = range(rng, box[0], box[1]), z = range(rng, box[2], box[3]), h = range(rng, 0.3, 0.65);
    if (clear && x > clear[0] && x < clear[1] && z > clear[2] && z < clear[3]) { m4.makeScale(0, 0, 0); stems.setMatrixAt(i, m4); heads.setMatrixAt(i, m4); continue; }
    m4.compose(p.set(x, 0, z), q, s.set(1, h, 1)); stems.setMatrixAt(i, m4);
    m4.compose(p.set(x, h, z), q, s.setScalar(range(rng, 0.8, 1.4))); heads.setMatrixAt(i, m4); heads.setColorAt(i, c.set(pick(rng, colors)));
  }
  scene.add(heads, stems);
}

/** Buzzing insects as glowing points; each one blinks out with a tiny flash at its vanish time. */
function swarm(rng, scene, n, box, t0, spread = 0.7, color = '#ffe7a3') {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), base = [], g = new THREE.BufferGeometry();
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) base.push([range(rng, box[0], box[1]), range(rng, box[2], box[3]), range(rng, box[4], box[5]), rng() * 50, range(rng, 1.5, 4), t0 + rng() * spread]);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, map: spriteTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; scene.add(pts);
  return (t) => {
    base.forEach(([x, y, z, ph, f, tv], i) => {
      const k = t < tv ? 1 : t < tv + 0.18 ? 1 + 5 * (1 - (t - tv) / 0.18) : 0;
      pos.set([x + Math.sin(t * f + ph) * 0.35, y + Math.sin(t * f * 1.7 + ph * 2) * 0.18, z + Math.cos(t * f * 0.8 + ph) * 0.35], i * 3);
      col.set([c.r * k * 1.4, c.g * k * 1.4, c.b * k * 1.4], i * 3);
    });
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  };
}

function butterflies(rng, scene, n, box, t0) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group(), wm = mat(pick(rng, ['#ff9a3c', '#3ec1ff', '#ffffff', '#ffd23f', '#b58cff']), { side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.08 });
    const wing = new THREE.PlaneGeometry(0.16, 0.12).translate(0.08, 0, 0);
    const l = new THREE.Mesh(wing, wm), r = new THREE.Mesh(wing, wm); r.scale.x = -1;
    b.add(l, r, new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.1), cmat('#222')));
    b.position.set(range(rng, box[0], box[1]), range(rng, box[2], box[3]), range(rng, box[4], box[5]));
    scene.add(b); list.push({ b, l, r, x: b.position.x, y: b.position.y, z: b.position.z, ph: rng() * 9, tv: t0 + rng() * 0.6 });
  }
  return (t) => list.forEach((o) => {
    o.b.visible = t < o.tv;
    const fl = Math.sin(t * 14 + o.ph) * 1.1; o.l.rotation.y = fl; o.r.rotation.y = -fl;
    o.b.position.set(o.x + Math.sin(t * 0.7 + o.ph) * 0.8, o.y + Math.sin(t * 2.1 + o.ph) * 0.15, o.z + Math.cos(t * 0.5 + o.ph) * 0.6);
    o.b.rotation.y = t * 0.7 + o.ph;
  });
}

function blossomOrchard(rng, scene, { zFrom = 6, zTo = -70, rows = [-9, -3, 3, 9], blossom = ['#f6c6d6', '#ffd9e6', '#ffffff', '#f2b3c8'] } = {}) {
  for (const x of rows) for (let z = zFrom; z > zTo; z -= 5) {
    const t = canopyTree(rng, { h: range(rng, 3.2, 3.8), r: range(rng, 1.4, 1.8), leaf: blossom, trunk: '#5b4434', blobs: 4 });
    t.position.set(x + range(rng, -0.3, 0.3), 0, z + range(rng, -0.4, 0.4)); scene.add(t);
  }
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 200), mat('#a58a65')); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.06, -60); scene.add(path);
}

function storeSign(text, { bg = '#ffffff', fg = '#c62828', w = 1024, h = 256, font = '800 110px Inter', k = 1.4 } = {}) {
  const t = canvasTexture(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 6); });
  return new THREE.Mesh(new THREE.PlaneGeometry(w / h, 1), new THREE.MeshBasicMaterial({ map: t.tex, color: new THREE.Color(k, k, k) }));
}

/* ============ 1. Dawn meadow: then every insect blinks out ============ */
function meadowScene({ seed, sky, fog, density, grass, tuftCols, flowerCols, nFlowers, sun, hemi, insects = true }) {
  const rng = rngFrom(seed);
  const { scene, camera } = shell(gradientTexture(sky), fog, density, 46);
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], hemi[2]));
  const s = new THREE.DirectionalLight(sun[0], sun[1]); s.position.set(-10, 6, -30); scene.add(s);
  ground(rng, scene, grass);
  tufts(rng, scene, 5200, [-14, 14, -40, 8], tuftCols);
  flowers(rng, scene, nFlowers, [-10, 10, -30, 7], flowerCols, [-1.3, 2.2, -3.5, 8]);
  for (const [x, z] of [[-9, -18], [7, -26], [-14, -36], [13, -14], [2, -46], [-6, -55], [18, -40]]) {
    const t = canopyTree(rngFrom(x * 31 + z), { h: range(rng, 5, 7), r: range(rng, 2.2, 3), leaf: ['#4f6e34', '#5d7a3a', '#3f5e2e'], trunk: '#4a3a2c' });
    t.position.set(x, 0, z); scene.add(t);
  }
  return { scene, camera, rng };
}

export function meadow() {
  const m = meadowScene({
    seed: 201, sky: [[0, '#6f87a8'], [0.55, '#e9c9a0'], [1, '#ffd49a']], fog: '#e3c6a2', density: 0.03,
    grass: '#5f7a3a', tuftCols: ['#6b8a3e', '#7d9a46', '#55733a', '#8aa04e'], flowerCols: ['#ff5a7a', '#ffd23f', '#ffffff', '#b58cff', '#ff9a3c'], nFlowers: 1800,
    sun: ['#ffcf96', 2.0], hemi: ['#d6e2ff', '#4a5a30', 1.15],
  });
  const { scene, camera, rng } = m;
  const VANISH = 3.4;
  const bugs = swarm(rng, scene, 700, [-6, 6, 0.25, 2.4, -14, 5], VANISH, 0.55);
  const flies = butterflies(rng, scene, 16, [-3, 3, 0.6, 1.8, -6, 3], VANISH);
  const motes = drift(rng, 300, [-6, 6, 0, 3, -10, 6], { color: '#ffe2b0', size: 0.04, fall: 0.02, sway: 0.3, opacity: 0.5 });
  scene.add(motes);
  const rig = cameraRig(camera, [
    { p: [0, 0.75, 6.5], l: [0, 0.75, -12] },
    { p: [0.5, 0.95, 2.5], l: [0.2, 0.9, -14] },
    { p: [0.8, 1.35, -1], l: [0, 1.0, -20] },
  ]);
  return { scene, camera, bloom: [0.75, 0.5, 0.68], exposure: 1.05, update(t, dur) { bugs(t); flies(t); motes.userData.update(t); rig(t / dur, 0.03, t); } };
}

/* ============ 2. Orchard in bloom, hives empty ============ */
export function orchard() {
  const rng = rngFrom(202);
  const { scene, camera } = shell(gradientTexture([[0, '#7fb0e0'], [0.6, '#d9e8f2'], [1, '#f3efe6']]), '#e2e8ec', 0.026, 46);
  scene.add(new THREE.HemisphereLight('#eaf3ff', '#5f7040', 1.25));
  const sun = new THREE.DirectionalLight('#fff3dc', 1.8); sun.position.set(12, 20, 6); scene.add(sun);
  ground(rng, scene, '#7a9a4a');
  tufts(rng, scene, 3000, [-14, 14, -45, 8], ['#86a64e', '#6f8f42', '#97b35a']);
  blossomOrchard(rng, scene);
  // hives along the path
  const hiveCols = ['#f2efe6', '#9fc3d9', '#f1d36b', '#f2efe6', '#c9e0b0', '#f2efe6'];
  hiveCols.forEach((c, i) => {
    const g = new THREE.Group();
    for (let k = 0; k < 3; k++) { const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.42), cmat(c)); box.position.y = 0.28 + k * 0.25; g.add(box); }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.5), cmat('#8a8f94')); roof.position.y = 1.05; g.add(roof);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.38), cmat('#6b5a48')); stand.position.y = 0.08; g.add(stand);
    g.position.set(i % 2 ? 1.75 : -1.75, 0, -3 - i * 3.2); g.rotation.y = range(rng, -0.2, 0.2); scene.add(g);
  });
  const keepers = new Crowd([
    { x: 1.1, z: -5.9, ry: -1.9, s: 1, body: '#f3f2ec', legs: '#f3f2ec', skin: '#c99a7a', hat: 'brim', hatColor: '#f3f2ec', phase: 0,
      pose: (p, t) => ({ lean: 0.35, head: 0.55, fR: 0.9, fL: 0.6, aL: 0.1, bob: Math.sin(t * 1.1) * 0.005 }) },
    { x: -1.0, z: -12.5, ry: 1.6, s: 1, body: '#f3f2ec', legs: '#f3f2ec', skin: '#8d5a3b', hat: 'brim', hatColor: '#f3f2ec', phase: 2,
      pose: (p, t) => ({ lean: 0.1, head: -0.25, headY: Math.sin(t * 0.6) * 0.5, aL: 0.15, aR: 0.15 }) },
  ]);
  scene.add(keepers.group);
  const petals = drift(rng, 900, [-7, 7, 0, 5, -30, 8], { color: '#ffd0de', size: 0.06, fall: 0.35, sway: 0.6, opacity: 0.95, additive: false });
  scene.add(petals);
  const rig = cameraRig(camera, [
    { p: [0, 1.8, 9], l: [0, 1.5, -20] },
    { p: [0.2, 1.7, 2.5], l: [0.6, 1.0, -9] },
    { p: [-0.2, 1.65, 0.6], l: [1.0, 0.9, -6.5] },
  ]);
  return { scene, camera, bloom: [0.35, 0.4, 0.88], exposure: 1.0, update(t, dur) { petals.userData.update(t); keepers.update(t); rig(t / dur, 0.03, t); } };
}

/* ============ 3. Silent forest at dusk: birds leave, chicks wait ============ */
export function forest() {
  const rng = rngFrom(203);
  const { scene, camera } = shell(gradientTexture([[0, '#252b4a'], [0.55, '#9a5f5c'], [1, '#e9a46e']]), '#6e5260', 0.034, 46);
  scene.add(new THREE.HemisphereLight('#b0a6d6', '#2a3222', 1.35));
  const sun = new THREE.DirectionalLight('#ffb27a', 1.6); sun.position.set(-10, 5, -30); scene.add(sun);
  ground(rng, scene, '#33402a');
  for (let i = 0; i < 70; i++) {
    const x = range(rng, -24, 24), z = range(rng, -60, -2);
    if (Math.abs(x) < 2.5 && z > -8) continue;
    const t = canopyTree(rng, { h: range(rng, 6, 10), r: range(rng, 1.8, 2.8), leaf: ['#2f4a32', '#3d5a36', '#28402c'], trunk: '#3a2e24' }); t.position.set(x, 0, z); scene.add(t);
  }
  // branch + nest with waiting chicks
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 6, 7), cmat('#3a2e24')); trunk.position.set(-2.4, 3, -2); scene.add(trunk);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3, 6), cmat('#3a2e24')); branch.rotation.z = Math.PI / 2 - 0.15; branch.position.set(-1.0, 2.05, -2); scene.add(branch);
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.11, 5, 10), cmat('#6b5236')); nest.rotation.x = Math.PI / 2; nest.position.set(0.1, 2.27, -2); scene.add(nest);
  const chicks = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), cmat('#8d8a80')));
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 4), cmat('#ffb02e')); beak.position.y = 0.1; c.add(beak);
    c.position.set(0.1 + (i - 1) * 0.12, 2.32, -2 + (i === 1 ? 0.06 : -0.03)); scene.add(c); chicks.push([c, i]);
  }
  // flock leaving
  const birdGeo = mergeGeometries([new THREE.ConeGeometry(0.06, 0.32, 4).rotateX(Math.PI / 2), new THREE.BoxGeometry(0.6, 0.015, 0.14)].map((g) => g.toNonIndexed()));
  const NB = 90; const flock = new THREE.InstancedMesh(birdGeo, mat('#1a1820'), NB); flock.frustumCulled = false; scene.add(flock);
  const fb = []; for (let i = 0; i < NB; i++) fb.push([range(rng, -10, 4), range(rng, 7, 14), range(rng, -14, -4), rng() * 9, range(rng, 4, 6)]);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const rig = cameraRig(camera, [
    { p: [1.8, 2.6, 3.6], l: [0.1, 2.3, -2] },
    { p: [1.2, 2.5, 1.4], l: [0.1, 2.35, -2] },
    { p: [0.6, 2.75, 0.4], l: [-0.6, 4.4, -12] },
  ]);
  return {
    scene, camera, bloom: [0.55, 0.5, 0.75], exposure: 1.25,
    update(t, dur) {
      chicks.forEach(([c, i]) => { c.rotation.x = -0.35 + Math.sin(t * 6 + i * 2) * 0.12; c.position.y = 2.32 + Math.abs(Math.sin(t * 5 + i)) * 0.02; });
      fb.forEach(([x, y, z, ph, v], i) => {
        q.setFromEuler(e.set(0, -0.5, Math.sin(t * 9 + ph) * 0.25));
        m4.compose(p.set(x + t * v * 0.8, y + t * 0.6 + Math.sin(t * 2 + ph) * 0.2, z - t * v), q, s.set(1, 1 + Math.sin(t * 14 + ph) * 0.8, 1));
        flock.setMatrixAt(i, m4);
      });
      flock.instanceMatrix.needsUpdate = true;
      rig(t / dur, 0.02, t);
    },
  };
}

/* ============ 4. Supermarket: fruit gone, grains stay ============ */
export function supermarket() {
  const rng = rngFrom(204);
  const { scene, camera } = shell('#9aa6aa', '#9aa6aa', 0.009, 50);
  scene.add(new THREE.HemisphereLight('#f2fbff', '#6d7570', 1.05));
  const d = new THREE.DirectionalLight('#ffffff', 0.5); d.position.set(2, 10, 3); scene.add(d);
  const L = 60, Wd = 12, H = 4.6;
  const tiles = canvasTexture(256, 256, (g) => { g.fillStyle = '#b9beb8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#a3a9a2'; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128); g.strokeStyle = '#8d938c'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); }).tex;
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(Wd / 2, L / 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.35, metalness: 0.05 })); floor.rotation.x = -Math.PI / 2; floor.position.z = -L / 2 + 8; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), mat('#eef1f0')); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -L / 2 + 8); scene.add(ceil);
  const panelMat = glow('#f4fffb', 1.5);
  for (let z = 6; z > -50; z -= 4) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 3.2), panelMat); m.position.set(0, H - 0.03, z); scene.add(m); }
  const shelfMat = cmat('#e9ece9'), crateMat = cmat('#9b7348'), crateIn = cmat('#3d2f22');
  // LEFT: produce crates, mostly empty
  const fruitCols = ['#d63a2f', '#7cb342', '#ffb300', '#ff7043'];
  for (let z = 4; z > -40; z -= 1.3) {
    for (let tier = 0; tier < 3; tier++) {
      const y = 0.55 + tier * 0.5, x = -4.6 - tier * 0.32;
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 1.15), crateMat); crate.position.set(x, y, z); crate.rotation.z = -0.25; scene.add(crate);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.05), crateIn); inner.position.set(x, y + 0.1, z); inner.rotation.z = -0.25; scene.add(inner);
      if (rng() < 0.12) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), cmat(pick(rng, fruitCols))); f.position.set(x + 0.1, y + 0.17, z + range(rng, -0.4, 0.4)); scene.add(f); }
    }
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 46), shelfMat); back.position.set(-5.7, 1.3, -18); scene.add(back);
  // RIGHT: staples, full shelves
  const packs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.32, 0.18), mat('#ffffff'), 2600);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(); let pi = 0;
  for (let tier = 0; tier < 5; tier++) {
    const y = 0.35 + tier * 0.45;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 46), shelfMat); board.position.set(4.9, y - 0.02, -18); scene.add(board);
    for (let z = 4.5; z > -40.5 && pi < 2600; z -= 0.21) for (const dx of [-0.15, 0.15]) {
      if (pi >= 2600) break;
      m4.compose(p.set(4.9 + dx, y + 0.17, z), q, s.set(1, range(rng, 0.8, 1.1), 1)); packs.setMatrixAt(pi, m4);
      packs.setColorAt(pi++, c.set(pick(rng, ['#f2d7a0', '#e8c27a', '#ffffff', '#f6e7b8', '#d9a55a', '#ffe08a'])));
    }
  }
  packs.count = pi; scene.add(packs);
  const back2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 46), shelfMat); back2.position.set(5.35, 1.3, -18); scene.add(back2);
  const signs = [
    ['FRUIT · SOLD OUT', '#ffffff', '#c62828', -3.6, -2],
    ['COFFEE · NONE LEFT', '#ffffff', '#6d4c41', -3.6, -12],
    ['CHOCOLATE · DISCONTINUED', '#ffffff', '#4e342e', -3.6, -22],
    ['BREAD · RICE · CORN', '#2e7d32', '#ffffff', 3.6, -6],
    ['LIMIT 2 PER CUSTOMER', '#ffd54f', '#212121', 3.6, -17],
  ];
  for (const [txt, bg, fg, x, z] of signs) { const m = storeSign(txt, { bg, fg, w: 1400, font: '800 104px Inter' }); m.scale.setScalar(0.62); m.position.set(x, 3.2, z); m.rotation.y = x < 0 ? 0.35 : -0.35; scene.add(m); const wire = new THREE.Mesh(new THREE.BoxGeometry(0.01, 1, 0.01), cmat('#555')); wire.position.set(x, 3.9, z); scene.add(wire); }
  const people = [];
  for (let i = 0; i < 16; i++) {
    const left = i % 2 === 0, z = -3 - i * 2.2 + range(rng, -0.5, 0.5);
    people.push({ x: left ? range(rng, -3.4, -2.6) : range(rng, 2.2, 3.4), z, ry: left ? -Math.PI / 2 + range(rng, -0.4, 0.4) : Math.PI / 2 + range(rng, -0.4, 0.4), s: range(rng, 0.92, 1.05),
      body: pick(rng, COATS), legs: pick(rng, ['#2a2d3a', '#3a2c22', '#4b4b55']), skin: pick(rng, SKIN), hat: rng() < 0.2 ? 'beanie' : null, hatColor: pick(rng, COATS), phase: rng() * 9, left,
      pose: (p, t) => (p.left ? { lean: 0.3, head: 0.55, fR: 0.9 + Math.sin(t * 0.8 + p.phase) * 0.1, fL: 0.3 } : { fR: 1.3, aR: 0.1, head: 0.2, turn: Math.sin(t * 0.5 + p.phase) * 0.3 }) });
  }
  const crowd = new Crowd(people); scene.add(crowd.group);
  const rig = cameraRig(camera, [
    { p: [0.4, 1.9, 7], l: [-1.2, 1.5, -20] },
    { p: [0, 1.75, 1], l: [-2.4, 1.2, -12] },
    { p: [-0.4, 1.65, -4], l: [-2.8, 1.0, -14] },
  ]);
  return { scene, camera, bloom: [0.25, 0.35, 0.92], exposure: 0.92, update(t, dur) { crowd.update(t); rig(t / dur, 0.03, t); } };
}

/* ============ 6. Hand pollination: workers on ladders ============ */
export function handPollination() {
  const rng = rngFrom(206);
  const { scene, camera } = shell(gradientTexture([[0, '#9cb6cf'], [0.6, '#e8e2cf'], [1, '#f1dfb8']]), '#e6dcc4', 0.011, 46);
  scene.add(new THREE.HemisphereLight('#f2f4ff', '#6b6a40', 1.2));
  const sun = new THREE.DirectionalLight('#fff0d0', 1.6); sun.position.set(8, 16, 10); scene.add(sun);
  ground(rng, scene, '#8a9a52');
  tufts(rng, scene, 2500, [-16, 16, -60, 8], ['#93a65a', '#7d9149', '#a3b366']);
  blossomOrchard(rng, scene, { blossom: ['#fbf4ec', '#ffffff', '#f4e4ec', '#efe8de'] });
  const ladderMat = cmat('#c7a46a');
  const people = [];
  for (const x of [-9, -3, 3, 9]) for (let z = 1; z > -46; z -= 5) {
    if (rng() < 0.2) continue;
    const side = rng() < 0.5 ? -1 : 1, lx = x + side * 1.05, lz = z + range(rng, -0.3, 0.3);
    const lad = new THREE.Group();
    for (const dx of [-0.2, 0.2]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.3, 0.05), ladderMat); rail.position.set(dx, 1.15, 0); lad.add(rail); }
    for (let y = 0.3; y < 2.2; y += 0.35) { const rung = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), ladderMat); rung.position.set(0, y, 0); lad.add(rung); }
    lad.position.set(lx, 0, lz); lad.rotation.set(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0); lad.rotateX(-0.18); scene.add(lad);
    people.push({ x: x + side * 1.3, y: 0.98, z: lz, ry: side < 0 ? Math.PI / 2 : -Math.PI / 2, s: 1, body: pick(rng, ['#2f6f9a', '#b4552f', '#e8e2d4', '#3f6b3a', '#c7a14a']), legs: '#2a2d3a', skin: pick(rng, SKIN),
      hat: pick(rng, ['brim', 'beanie', null]), hatColor: pick(rng, ['#e9d9b0', '#c03a2b', '#2f4a6a']), phase: rng() * 9,
      pose: (p, t) => ({ fR: 2.3 + Math.sin(t * 3 + p.phase) * 0.18, aR: 0.15, fL: 1.9, aL: 0.25 + Math.sin(t * 2.2 + p.phase) * 0.1, head: -0.45, lean: -0.05 }) });
  }
  const crowd = new Crowd(people); scene.add(crowd.group);
  const petals = drift(rng, 500, [-8, 8, 0, 5, -30, 8], { color: '#fff6ee', size: 0.05, fall: 0.25, sway: 0.5, opacity: 0.9, additive: false });
  scene.add(petals);
  const rig = cameraRig(camera, [
    { p: [0, 2.1, 7], l: [0, 2.0, -12] },
    { p: [0, 5, 10], l: [0, 1.6, -18] },
    { p: [0, 11, 14], l: [0, 0.5, -28] },
  ]);
  return { scene, camera, bloom: [0.3, 0.4, 0.9], exposure: 1.0, update(t, dur) { petals.userData.update(t); crowd.update(t); rig(t / dur, 0.03, t); } };
}

/* ============ 7. Vertical farm with drone pollinators ============ */
export function verticalFarm() {
  const rng = rngFrom(207);
  const { scene, camera } = shell('#0a0612', '#22102a', 0.028, 50);
  scene.add(new THREE.HemisphereLight('#c49aff', '#100818', 0.55));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 120), mat('#1a1420', { roughness: 0.35, metalness: 0.3 })); floor.rotation.x = -Math.PI / 2; floor.position.z = -50; scene.add(floor);
  const rackMat = cmat('#2a2a33'), ledA = glow('#ff4fd8', 1.9), ledB = glow('#9f6bff', 1.8);
  const plantGeo = new THREE.ConeGeometry(0.11, 0.32, 5).translate(0, 0.16, 0);
  const NP = 9000; const plants = new THREE.InstancedMesh(plantGeo, mat('#ffffff', { emissive: '#1e5a1e', emissiveIntensity: 0.4 }), NP);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(); let pi = 0;
  for (const x of [-7.5, -2.6, 2.6, 7.5]) for (let tier = 0; tier < 5; tier++) {
    const y = 0.5 + tier * 1.05;
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 60), rackMat); tray.position.set(x, y, -26); scene.add(tray);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 60), tier % 2 ? ledA : ledB); strip.position.set(x, y + 0.98, -26); scene.add(strip);
    for (let z = 3.6; z > -55.6 && pi < NP; z -= 0.42) for (const dx of [-0.42, 0, 0.42]) {
      if (pi >= NP) break;
      m4.compose(p.set(x + dx, y + 0.05, z + range(rng, -0.05, 0.05)), q.setFromEuler(new THREE.Euler(0, rng() * 6, 0)), s.setScalar(range(rng, 0.8, 1.3)));
      plants.setMatrixAt(pi, m4); plants.setColorAt(pi++, c.set(pick(rng, ['#4caf50', '#66bb6a', '#7cb342', '#43a047', '#ef5350'])));
    }
    for (let z = 4; z > -56; z -= 6) for (const dx of [-0.68, 0.68]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), rackMat); post.position.set(x + dx, y + 0.5, z); scene.add(post); }
  }
  plants.count = pi; scene.add(plants);
  // drones
  const drones = [];
  const bodyGeo = new THREE.BoxGeometry(0.22, 0.06, 0.22), rotorGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.01, 10);
  for (let i = 0; i < 34; i++) {
    const d = new THREE.Group(); d.add(new THREE.Mesh(bodyGeo, cmat('#d8dde6', { metalness: 0.4, roughness: 0.4 })));
    for (const [rx, rz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) { const r = new THREE.Mesh(rotorGeo, glow('#bfe9ff', 1.4)); r.position.set(rx, 0.04, rz); d.add(r); }
    const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), glow('#5df2ff', 6)); eye.position.y = -0.05; d.add(eye);
    scene.add(d);
    drones.push({ d, x: pick(rng, [-5, 0, 5]) + range(rng, -0.8, 0.8), y: 0.9 + Math.floor(rng() * 5) * 1.05 + 0.55, z: range(rng, -48, 2), ph: rng() * 9, v: range(rng, 0.8, 1.6) * (rng() < 0.5 ? -1 : 1) });
  }
  const rig = cameraRig(camera, [
    { p: [0, 1.6, 8], l: [0, 2.6, -30] },
    { p: [0.2, 2.6, 2], l: [0, 2.4, -30] },
    { p: [0, 3.8, -4], l: [0, 1.6, -34] },
  ]);
  return {
    scene, camera, bloom: [0.7, 0.5, 0.72], exposure: 1.0,
    update(t, dur) {
      drones.forEach((o) => {
        o.d.position.set(o.x + Math.sin(t * 1.3 + o.ph) * 0.9, o.y + Math.sin(t * 2.7 + o.ph) * 0.12, o.z + o.v * t);
        o.d.rotation.set(Math.sin(t * 1.1 + o.ph) * 0.15, t * 0.4 + o.ph, Math.cos(t * 1.3 + o.ph) * 0.15);
      });
      rig(t / dur, 0.03, t);
    },
  };
}

/* ============ 8. Ration line at night, in the rain ============ */
export function rationLine() {
  const rng = rngFrom(208);
  const { scene, camera } = shell(gradientTexture([[0, '#06080f'], [0.6, '#141a2a'], [1, '#2a2a38']]), '#1a1d2a', 0.028, 48);
  scene.add(new THREE.HemisphereLight('#7080b0', '#14141a', 1.15));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 300), mat('#1c1d22', { roughness: 0.5, metalness: 0.15 })); road.rotation.x = -Math.PI / 2; road.position.z = -120; scene.add(road);
  const facades = [0, 1, 2].map(() => windowTexture(rng, { lit: 0.22, wall: '#14161c' }));
  for (const side of [-1, 1]) { let z = 14; while (z > -200) { const w = range(rng, 10, 16), d = range(rng, 9, 15), h = range(rng, 18, 60); const b = building(w, h, d, pick(rng, facades), 1.0); b.position.set(side * (9.5 + w / 2), h / 2, z - d / 2); scene.add(b); z -= d + range(rng, 0.2, 1.2); } }
  // distribution centre
  const hall = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 6), cmat('#3a3f4a')); hall.position.set(0, 3.5, -46); scene.add(hall);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.2), glow('#ffe7b8', 1.3)); door.position.set(0, 1.6, -42.95); scene.add(door);
  const { mesh: sign } = neonSign('RATION DAY · BREAD · RICE · CORN', { color: '#7dff9e', w: 1600, h: 256, font: '800 96px Inter' }); sign.scale.setScalar(2); sign.position.set(0, 5.4, -42.9); scene.add(sign);
  const doorL = new THREE.PointLight('#ffd9a0', 3, 30, 1.2); doorL.position.set(0, 3, -40); scene.add(doorL);
  // trucks
  for (const [x, z] of [[-6, -38], [6.2, -36]]) {
    const tr = new THREE.Group(); const k = cmat('#3f4a34');
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 5.5), k); box.position.y = 1.9; tr.add(box);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 1.6), k); cab.position.set(0, 1.5, 3.6); tr.add(cab);
    for (const wz of [-1.8, 1.4, 3.6]) for (const wx of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8), cmat('#111')); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.45, wz); tr.add(w); }
    tr.position.set(x, 0, z); scene.add(tr);
  }
  // barrier + queue
  const rail = cmat('#9aa0a8', { metalness: 0.6, roughness: 0.4 });
  for (let z = 6; z > -42; z -= 2.5) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 2.4), rail); b.position.set(-0.8, 0.5, z); scene.add(b); }
  const people = [];
  for (let i = 0; i < 70; i++) {
    const z = -41 + i * 0.68 + range(rng, -0.12, 0.12);
    if (z > 5.5) break;
    people.push({ x: -2.0 + range(rng, -0.25, 0.25), z, ry: Math.PI + range(rng, -0.2, 0.2), s: range(rng, 0.85, 1.05), body: pick(rng, ['#2b2f3a', '#3a3030', '#2a3a33', '#4a3f35', '#1f2430', '#5a4a3a']), legs: '#16181e', skin: pick(rng, SKIN),
      hat: pick(rng, ['hood', 'beanie', null, 'hood']), hatColor: pick(rng, ['#2b2f3a', '#3a3030', '#4a4f5a']), phase: rng() * 9, child: false,
      pose: (p, t) => ({ dz: -Math.max(0, Math.sin(t * 0.5 + p.phase)) * 0.08, lean: 0.12, head: 0.35, fL: 0.25, fR: 0.25, tilt: Math.sin(t * 0.6 + p.phase) * 0.03 }) });
  }
  // a few small children in the line
  for (let i = 0; i < 6; i++) { const host = people[5 + i * 9]; if (host) people.push({ ...host, x: host.x + 0.45, z: host.z + 0.15, s: 0.62, hat: 'beanie', hatColor: pick(rng, ['#c03a2b', '#ffd23f', '#3ec1ff']), body: pick(rng, ['#d9822b', '#3f6b9a', '#8a2f5a']) }); }
  const crowd = new Crowd(people); scene.add(crowd.group);
  for (let z = 4; z > -40; z -= 12) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5, 5), cmat('#1b1b20')); pole.position.set(2.8, 2.5, z); scene.add(pole); const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), glow('#cfe0ff', 4)); bulb.position.set(2.5, 5, z); scene.add(bulb); const l = new THREE.PointLight('#cfe0ff', 3.2, 16, 1.1); l.position.set(0.2, 4.6, z); scene.add(l); }
  const rain = drift(rng, 2600, [-8, 8, 0, 10, -30, 10], { color: '#a9c4ff', size: 0.035, fall: 9, sway: 0.05, opacity: 0.55, additive: true });
  scene.add(rain);
  const rig = cameraRig(camera, [
    { p: [1.4, 1.65, 7], l: [-2.2, 1.4, -6] },
    { p: [1.6, 2.2, -4], l: [-1.6, 1.6, -26] },
    { p: [1.2, 2.8, -14], l: [-0.6, 3.0, -44] },
  ]);
  return { scene, camera, bloom: [0.55, 0.5, 0.78], exposure: 1.15, update(t, dur) { rain.userData.update(t); crowd.update(t); rig(t / dur, 0.03, t); } };
}

/* ============ 9. The meadow, years later ============ */
export function quietMeadow() {
  const m = meadowScene({
    seed: 209, sky: [[0, '#3b4058'], [0.6, '#9a7f78'], [1, '#d6a27c']], fog: '#8f7c78', density: 0.035,
    grass: '#6b6a44', tuftCols: ['#7a7748', '#8a8250', '#6a6a42', '#9a8e5a'], flowerCols: ['#cfc6b8', '#b8b0a2'], nFlowers: 160,
    sun: ['#ffbf8a', 1.4], hemi: ['#b8b4cc', '#3a3424', 0.95],
  });
  const { scene, camera } = m;
  const kid = new Crowd([{ x: 0, z: -3, ry: Math.PI, s: 0.62, body: '#d9822b', legs: '#2a2d3a', skin: '#c98e66', hat: 'beanie', hatColor: '#c03a2b', phase: 0,
    pose: (p, t) => ({ head: -0.1, headY: Math.sin(t * 0.35) * 0.4, aL: 0.12, aR: 0.12, fR: 0.25 }) }]);
  scene.add(kid.group);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 8), mat('#dfeef5', { transparent: true, opacity: 0.55, roughness: 0.1 }));
  scene.add(jar);
  const rig = cameraRig(camera, [
    { p: [0.6, 0.9, -1.2], l: [0, 0.75, -3.4] },
    { p: [1.2, 1.4, 2.5], l: [0, 1.0, -6] },
    { p: [1.6, 2.4, 7.5], l: [0, 1.5, -12] },
  ]);
  return {
    scene, camera, bloom: [0.45, 0.5, 0.8], exposure: 1.0,
    update(t, dur) {
      kid.update(t);
      jar.position.set(0.32, 0.08, -2.75);
      rig(t / dur, 0.02, t);
    },
  };
}
