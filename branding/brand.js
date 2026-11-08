// Renders the Hypothetica profile image and cover from the same low-poly Earth used in the film.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { earth } from '../what-if/src/scenes-b.js';

const q = new URLSearchParams(location.search);
const kind = q.get('kind') || 'profile';
const [W, H] = kind === 'cover' ? [1640, 924] : [1080, 1080];
const stage = document.getElementById('stage');
stage.style.width = `${W}px`; stage.style.height = `${H}px`;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

await Promise.all(['400 40px "Libre Baskerville"', 'italic 400 40px "Libre Baskerville"', '800 40px Inter'].map((f) => document.fonts.load(f)));

const shot = earth();
const { scene, camera } = shot;
const gold = (k) => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf7a').multiplyScalar(k) });
let bloom = [0.9, 0.6, 0.55];

if (kind === 'profile') {
  shot.update(0.05, 7); // before any ship launches: a clean planet
  // the mark: Earth wrapped in a single golden orbit with one traveller on it
  const orbit = new THREE.Group();
  orbit.add(new THREE.Mesh(new THREE.TorusGeometry(15.2, 0.11, 6, 240), gold(1.6)));
  const traveller = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), gold(6));
  const a = -0.5; traveller.position.set(Math.cos(a) * 15.2, Math.sin(a) * 15.2, 0); orbit.add(traveller);
  const trail = new THREE.Mesh(new THREE.TorusGeometry(15.2, 0.22, 6, 80, 0.75), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2a8').multiplyScalar(2.2), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  trail.rotation.z = a; orbit.add(trail);
  orbit.rotation.set(1.18, 0.0, -0.42);
  scene.add(orbit);
  camera.aspect = 1; camera.fov = 40; camera.updateProjectionMatrix();
  camera.position.set(-4, 6, 53); camera.lookAt(0, 0.4, 0);
  bloom = [0.85, 0.55, 0.6];
} else if (kind === 'cover') {
  shot.update(Number(q.get('t') || 4.8), 7);
  camera.aspect = W / H; camera.fov = 40; camera.updateProjectionMatrix();
  camera.position.set(-4, 3, 41); camera.lookAt(-17, 0.5, 0);
  document.getElementById('stage').insertAdjacentHTML('beforeend', `
    <div class="ov cover-shade"></div>
    <div class="title">
      <div class="kicker">WHAT IF · ANIMATED</div>
      <div class="name">Hypothe<em>tica</em></div>
      <div class="tag">One question. The whole world changes.</div>
      <div class="rule"></div>
      <div class="meta">NEW 3D WHAT IF EVERY WEEK</div>
    </div>
`);
  if (q.has('guides')) {
    // desktop shows the middle 1640x624 band; mobile shows roughly the middle 1230x924
    stage.insertAdjacentHTML('beforeend', `<div class="guide" style="left:0;right:0;top:150px;height:624px"></div><div class="guide" style="left:205px;width:1230px;top:0;bottom:0;border-color:rgba(80,200,255,.9)"></div>`);
  }
}

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), ...bloom));
composer.addPass(new OutputPass());
composer.render();
window.__done = true;
