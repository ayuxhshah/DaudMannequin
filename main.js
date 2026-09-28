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

// Scroll is measured in viewport heights.
//
// 0 = Camera 1
// 1 = Camera 2
// 2 = Camera 3
// 3 = Camera 4
// 4 = Camera 5
// 5 = Camera 6
// 6 = Camera 7

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
// BLENDER → THREE.JS CAMERA CONVERSION
// -----------------------------------------------------

// Blender:
//   X = right
//   Y = forward/back
//   Z = up
//
// Three.js / glTF:
//   X = right
//   Y = up
//   Z = forward/back
//
// This conversion matches the coordinate-system change
// used when bringing Blender scenes into glTF/Three.js.

const BLENDER_TO_THREE = new THREE.Matrix4().makeRotationX(
  -Math.PI / 2
);

const THREE_TO_BLENDER = BLENDER_TO_THREE
  .clone()
  .invert();

/**
 * Creates a Three.js camera transform from a Blender
 * camera transform.
 *
 * Blender position is scaled by 0.031 because the
 * mannequin is currently scaled by 0.031.
 */
function createBlenderCamera(
  x,
  y,
  z,
  rotationX,
  rotationY,
  rotationZ
) {
  // -----------------------------------------------
  // POSITION
  // -----------------------------------------------

  const position = new THREE.Vector3(
    x * 0.031,
    y * 0.031,
    z * 0.031
  );

  // Blender Euler rotation
  const blenderEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(rotationX),
    THREE.MathUtils.degToRad(rotationY),
    THREE.MathUtils.degToRad(rotationZ),
    "XYZ"
  );

  const blenderRotation = new THREE.Matrix4();
  blenderRotation.makeRotationFromEuler(blenderEuler);

  // -----------------------------------------------
  // CONVERT ROTATION
  // -----------------------------------------------

  const threeRotation = new THREE.Matrix4();

  threeRotation
    .copy(BLENDER_TO_THREE)
    .multiply(blenderRotation)
    .multiply(THREE_TO_BLENDER);

  const quaternion = new THREE.Quaternion();

  quaternion.setFromRotationMatrix(threeRotation);

  return {
    position,
    quaternion,
  };
}

// -----------------------------------------------------
// CAMERA STATES
// -----------------------------------------------------

const cameraStates = [
  // ---------------------------------------------------
  // 01 — HERO
  // Blender:
  // X -133.14
  // Y -298.75
  // Z 220.86
  // RX 66.96°
  // RY 0°
  // RZ -25.20°
  // ---------------------------------------------------

  createBlenderCamera(
    -133.14,
    -298.75,
    220.86,
    66.96,
    -0.000309,
    -25.2
  ),

  // ---------------------------------------------------
  // 02 — SERVICE
  // Blender:
  // X -181.30
  // Y -222.34
  // Z -9.2144
  // RX 106.64°
  // RY 0°
  // RZ -30.96°
  // ---------------------------------------------------

  createBlenderCamera(
    -181.3,
    -222.34,
    -9.2144,
    106.64,
    -0.000018,
    -30.96
  ),

  // ---------------------------------------------------
  // 03 — ABOUT
  // Blender:
  // X 122.61
  // Y 72.408
  // Z 160.58
  // RX 70.48°
  // RY 0°
  // RZ 114.64°
  // ---------------------------------------------------

  createBlenderCamera(
    122.61,
    72.408,
    160.58,
    70.48,
    -0.000171,
    114.64
  ),

  // ---------------------------------------------------
  // 04 — PROJECT
  // Blender:
  // X -65.746
  // Y -52.944
  // Z 17.939
  // RX 149.20°
  // RY 0°
  // RZ -35.76°
  // ---------------------------------------------------

  createBlenderCamera(
    -65.746,
    -52.944,
    17.939,
    149.2,
    -0.00006,
    -35.76
  ),

  // ---------------------------------------------------
  // 05 — TESTIMONIALS
  // Blender:
  // X 167.75
  // Y 162.91
  // Z 35.415
  // RX 97.36°
  // RY 0°
  // RZ 115.92°
  // ---------------------------------------------------

  createBlenderCamera(
    167.75,
    162.91,
    35.415,
    97.36,
    -0.00028,
    115.92
  ),

  // ---------------------------------------------------
  // 06 — FAQ
  // Blender:
  // X -39.796
  // Y -63.091
  // Z 44.541
  // RX 141.52°
  // RY 0°
  // RZ -37.36°
  // ---------------------------------------------------

  createBlenderCamera(
    -39.796,
    -63.091,
    44.541,
    141.52,
    -0.000219,
    -37.36
  ),

  // ---------------------------------------------------
  // 07 — CONTACT
  // Same as Camera 1
  // ---------------------------------------------------

  createBlenderCamera(
    -133.14,
    -298.75,
    220.86,
    66.96,
    -0.000309,
    -25.2
  ),
];

// -----------------------------------------------------
// CAMERA ANIMATION
// -----------------------------------------------------

const currentPosition = new THREE.Vector3();
const currentQuaternion = new THREE.Quaternion();

function ease(t) {
  return t * t * (3 - 2 * t);
}

// -----------------------------------------------------
// ANIMATION
// -----------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Smooth incoming scroll
  scroll += (scrollTarget - scroll) * 0.08;

  // -----------------------------------------------
  // CURRENT CAMERA CHAPTER
  // -----------------------------------------------

  const maxIndex = cameraStates.length - 1;

  const exact = THREE.MathUtils.clamp(
    scroll,
    0,
    maxIndex
  );

  const index = Math.min(
    Math.floor(exact),
    maxIndex
  );

  const next = Math.min(
    index + 1,
    maxIndex
  );

  // -----------------------------------------------
  // LOCAL TRANSITION PROGRESS
  // -----------------------------------------------

  const rawLocal = exact - index;

  const local = ease(rawLocal);

  const currentCamera = cameraStates[index];
  const nextCamera = cameraStates[next];

  // -----------------------------------------------
  // POSITION
  // -----------------------------------------------

  currentPosition.lerpVectors(
    currentCamera.position,
    nextCamera.position,
    local
  );

  camera.position.copy(currentPosition);

  // -----------------------------------------------
  // ROTATION
  // -----------------------------------------------

  currentQuaternion.slerpQuaternions(
    currentCamera.quaternion,
    nextCamera.quaternion,
    local
  );

  camera.quaternion.copy(currentQuaternion);

  // -----------------------------------------------
  // MANNEQUIN FLOAT
  // -----------------------------------------------

  if (hero) {
    heroRig.position.y =
      Math.sin(clock.getElapsedTime() * 1.3) * 0.02;
  }

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------

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
