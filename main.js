import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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

// Initial camera position
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

let hero = null;

new GLTFLoader().load(
  "./DaudHero.glb",
  (gltf) => {
    hero = gltf.scene;

    hero.scale.setScalar(0.031);
    hero.position.set(0, -2.35, 0);
    hero.rotation.y = Math.PI;

    heroRig.add(hero);
  },
  undefined,
  (error) => {
    console.error("Failed to load DaudHero.glb:", error);
  }
);

// -----------------------------------------------------
// SCROLL FROM FRAMER
// -----------------------------------------------------

// This is now measured in viewport-heights.
//
// 0 = first camera
// 1 = second camera
// 2 = third camera
// ...
// 6 = seventh camera

let scrollTarget = 0;
let scroll = 0;

window.addEventListener("message", (event) => {
  if (event.data?.type !== "scroll") return;

  scrollTarget = THREE.MathUtils.clamp(
    event.data.progress,
    0,
    6
  );
});

// -----------------------------------------------------
// CAMERA STATES
// -----------------------------------------------------

const cameraStates = [
  // ---------------------------------------------------
  // 01 — HERO
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(0, 0.3, 8),
    target: new THREE.Vector3(0, -0.15, 0),
  },

  // ---------------------------------------------------
  // 02 — SERVICE
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(-0.9, 1.1, 3.2),
    target: new THREE.Vector3(0, 0.45, 0),
  },

  // ---------------------------------------------------
  // 03 — ABOUT
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(2.5, 0.8, -1.2),
    target: new THREE.Vector3(0, 0.8, 0),
  },

  // ---------------------------------------------------
  // 04 — PROJECT
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(-1.1, 0.6, 1.4),
    target: new THREE.Vector3(0, 0.35, 0),
  },

  // ---------------------------------------------------
  // 05 — TESTIMONIALS
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(2.3, 3.2, 0.6),
    target: new THREE.Vector3(0, 0.3, 0),
  },

  // ---------------------------------------------------
  // 06 — FAQ
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(-0.6, 1.3, 2.1),
    target: new THREE.Vector3(0, 0.6, 0),
  },

  // ---------------------------------------------------
  // 07 — CONTACT
  // ---------------------------------------------------
  {
    position: new THREE.Vector3(0, 0.45, 7.2),
    target: new THREE.Vector3(0, 0.1, 0),
  },
];

// -----------------------------------------------------
// CAMERA ANIMATION HELPERS
// -----------------------------------------------------

const currentTarget = new THREE.Vector3();

function ease(t) {
  return t * t * (3 - 2 * t);
}

// -----------------------------------------------------
// ANIMATION
// -----------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Smooth the incoming scroll
  scroll += (scrollTarget - scroll) * 0.08;

  // ---------------------------------------------------
  // DETERMINE CURRENT CAMERA CHAPTER
  // ---------------------------------------------------

  const maxCameraIndex = cameraStates.length - 1;

  const exact = THREE.MathUtils.clamp(
    scroll,
    0,
    maxCameraIndex
  );

  const index = Math.min(
    Math.floor(exact),
    maxCameraIndex
  );

  const next = Math.min(
    index + 1,
    maxCameraIndex
  );

  // Progress between the current camera and next camera
  const rawLocal = exact - index;

  const local = ease(rawLocal);

  const currentCamera = cameraStates[index];
  const nextCamera = cameraStates[next];

  // ---------------------------------------------------
  // INTERPOLATE CAMERA POSITION
  // ---------------------------------------------------

  camera.position.lerpVectors(
    currentCamera.position,
    nextCamera.position,
    local
  );

  // ---------------------------------------------------
  // INTERPOLATE LOOK-AT TARGET
  // ---------------------------------------------------

  currentTarget.lerpVectors(
    currentCamera.target,
    nextCamera.target,
    local
  );

  camera.lookAt(currentTarget);

  // ---------------------------------------------------
  // MANNEQUIN FLOAT
  // ---------------------------------------------------

  if (hero) {
    heroRig.position.y =
      Math.sin(clock.getElapsedTime() * 1.3) * 0.02;
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  renderer.render(scene, camera);
}

// Start animation
animate();

// -----------------------------------------------------
// RESIZE
// -----------------------------------------------------

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
