import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.163/examples/jsm/loaders/GLTFLoader.js";

// ------------------------------------------------------
// CANVAS + RENDERER
// ------------------------------------------------------

const canvas = document.getElementById("heroCanvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// ------------------------------------------------------
// SCENE
// ------------------------------------------------------

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// ------------------------------------------------------
// LIGHTS
// ------------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 1.3));

const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(5, 5, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xff8ad8, 1.6);
fill.position.set(-5, 2, -4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0x7d7dff, 1.2);
rim.position.set(2, 6, -6);
scene.add(rim);

// ------------------------------------------------------
// HERO MODEL
// ------------------------------------------------------

const heroRig = new THREE.Group();
scene.add(heroRig);

let hero;

new GLTFLoader().load("./DaudHero.glb", (gltf) => {
  hero = gltf.scene;

  hero.scale.setScalar(0.031);
  hero.position.set(0, -2.35, 0);
  hero.rotation.y = Math.PI;

  heroRig.add(hero);
});

// ------------------------------------------------------
// BLENDER CAMERA CONVERTER
// ------------------------------------------------------

const SCALE = 0.0265;

function blenderPosition(x, y, z) {
  return new THREE.Vector3(
    x * SCALE,
    z * SCALE,
    y * SCALE
  );
}

// ------------------------------------------------------
// CAMERA STATES (7 SECTIONS)
// ------------------------------------------------------

const cameraStates = [

  // 1 — HERO
  {
    position: blenderPosition(-133.14, -298.75, 220.86),
    target: new THREE.Vector3(0, -0.25, 0)
  },

  // 2 — SERVICE
  {
    position: blenderPosition(-181.30, -222.34, -9.2144),
    target: new THREE.Vector3(0, 0.2, 0)
  },

  // 3 — ABOUT
  {
    position: blenderPosition(122.61, 72.408, 160.58),
    target: new THREE.Vector3(0, 0.55, 0)
  },

  // 4 — PROJECT
  {
    position: blenderPosition(-65.746, -52.944, 17.939),
    target: new THREE.Vector3(0, 0.25, 0)
  },

  // 5 — TESTIMONIALS
  {
    position: blenderPosition(167.75, 162.91, 35.415),
    target: new THREE.Vector3(0, -0.1, 0)
  },

  // 6 — FAQ
  {
    position: blenderPosition(-39.796, -63.091, 44.541),
    target: new THREE.Vector3(0, 0.45, 0)
  },

  // 7 — CONTACT
  {
    position: blenderPosition(-133.14, -298.75, 220.86),
    target: new THREE.Vector3(0, -0.2, 0)
  }

];

// ------------------------------------------------------
// SCROLL FROM FRAMER
// ------------------------------------------------------

let scrollTarget = 0;
let scroll = 0;

window.addEventListener("message", (event) => {
  if (event.data?.type === "scroll") {
    scrollTarget = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

const tempTarget = new THREE.Vector3();
const clock = new THREE.Clock();

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// ------------------------------------------------------
// ANIMATE
// ------------------------------------------------------

function animate() {

  requestAnimationFrame(animate);

  scroll += (scrollTarget - scroll) * 0.08;

  const sectionCount = cameraStates.length;
  const totalSections = sectionCount - 1;

  const exact = scroll * totalSections;
  const index = Math.floor(exact);
  const nextIndex = Math.min(index + 1, totalSections);

  const localProgress = smoothstep(exact - index);

  const current = cameraStates[index];
  const next = cameraStates[nextIndex];

  camera.position.lerpVectors(
    current.position,
    next.position,
    localProgress
  );

  tempTarget.lerpVectors(
    current.target,
    next.target,
    localProgress
  );

  camera.lookAt(tempTarget);

  // subtle floating motion
  heroRig.position.y =
    Math.sin(clock.getElapsedTime() * 1.3) * 0.025;

  heroRig.rotation.y =
    Math.sin(clock.getElapsedTime() * 0.4) * 0.03;

  renderer.render(scene, camera);

}

animate();

// ------------------------------------------------------
// RESIZE
// ------------------------------------------------------

window.addEventListener("resize", () => {

  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

});
