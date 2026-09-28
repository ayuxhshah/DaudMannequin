import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.163/examples/jsm/loaders/GLTFLoader.js";

// -----------------------------------------------------
// RENDERER
// -----------------------------------------------------

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

// -----------------------------------------------------
// SCENE
// -----------------------------------------------------

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// THIS IS YOUR ORIGINAL HERO CAMERA
camera.position.set(0, 0.3, 8);

// -----------------------------------------------------
// LIGHTS
// -----------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 1));

const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(5, 5, 5);
scene.add(key);

const rim = new THREE.DirectionalLight(0xff8ad8, 1.2);
rim.position.set(-5, 3, -5);
scene.add(rim);

// -----------------------------------------------------
// HERO MODEL
// -----------------------------------------------------

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

// -----------------------------------------------------
// SCROLL FROM FRAMER
// -----------------------------------------------------

let scrollTarget = 0;
let scroll = 0;

window.addEventListener("message", (event) => {
  if (event.data?.type === "scroll") {
    scrollTarget = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

// -----------------------------------------------------
// CAMERA ANIMATION
// -----------------------------------------------------

const clock = new THREE.Clock();

const cameraStates = [
  // HERO
  {
    position: new THREE.Vector3(0, 0.3, 8),
    target: new THREE.Vector3(0, -0.15, 0),
  },

  // SERVICE
  {
    position: new THREE.Vector3(-0.9, 1.1, 3.2),
    target: new THREE.Vector3(0, 0.45, 0),
  },

  // ABOUT
  {
    position: new THREE.Vector3(2.5, 0.8, -1.2),
    target: new THREE.Vector3(0, 0.8, 0),
  },

  // PROJECT
  {
    position: new THREE.Vector3(-1.1, 0.6, 1.4),
    target: new THREE.Vector3(0, 0.35, 0),
  },

  // TESTIMONIALS
  {
    position: new THREE.Vector3(2.3, 3.2, 0.6),
    target: new THREE.Vector3(0, 0.3, 0),
  },

  // FAQ
  {
    position: new THREE.Vector3(-0.6, 1.3, 2.1),
    target: new THREE.Vector3(0, 0.6, 0),
  },

  // CONTACT
  {
    position: new THREE.Vector3(0, 0.45, 7.2),
    target: new THREE.Vector3(0, 0.1, 0),
  },
];

const currentTarget = new THREE.Vector3();

function ease(t) {
  return t * t * (3 - 2 * t);
}

// -----------------------------------------------------
// ANIMATE
// -----------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

  scroll += (scrollTarget - scroll) * 0.08;

  const total = cameraStates.length - 1;

  const exact = scroll * total;
  const index = Math.floor(exact);
  const next = Math.min(index + 1, total);

  const local = ease(exact - index);

  const a = cameraStates[index];
  const b = cameraStates[next];

  camera.position.lerpVectors(a.position, b.position, local);
  currentTarget.lerpVectors(a.target, b.target, local);
  camera.lookAt(currentTarget);

  // Floating mannequin
  heroRig.position.y = Math.sin(clock.getElapsedTime() * 1.3) * 0.02;

  renderer.render(scene, camera);
}

animate();

// -----------------------------------------------------
// RESIZE
// -----------------------------------------------------

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
