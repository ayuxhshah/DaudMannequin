import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// -------------------------------------------------------
// Renderer
// -------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("heroCanvas"),
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0xffffff, 0);

// -------------------------------------------------------
// Scene
// -------------------------------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0.3, 8);

// -------------------------------------------------------
// Lighting (temporary V7 lighting)
// -------------------------------------------------------
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(5, 6, 6);
scene.add(key);

const rim = new THREE.DirectionalLight(0xff8ad8, 1.2);
rim.position.set(-5, 3, -5);
scene.add(rim);

const fill = new THREE.DirectionalLight(0x9cc0ff, 0.7);
fill.position.set(0, -4, 5);
scene.add(fill);

// -------------------------------------------------------
// Hero Rig
// -------------------------------------------------------
const heroRig = new THREE.Group();
scene.add(heroRig);

let hero;
let scrollTarget = 0;
let scroll = 0;

new GLTFLoader().load("./DaudHero.glb", (gltf) => {
  hero = gltf.scene;

  // SCALE (final for your export)
  hero.scale.setScalar(0.031);

  // OFFSET INSIDE GROUP.
  // This moves the character so HeroRig's origin behaves
  // like it's inside the chest.
  hero.position.set(0, -2.35, 0);

  // Face camera.
  hero.rotation.y = Math.PI;

  heroRig.add(hero);

  console.log("Hero loaded.");
});

// -------------------------------------------------------
// Scroll bridge
// -------------------------------------------------------
window.addEventListener("message", (event) => {
  if (event.data?.type === "scroll") {
    scrollTarget = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max > 0) scrollTarget = window.scrollY / max;
});

// -------------------------------------------------------
// Timeline
// -------------------------------------------------------
const poses = [
  {
    s: 0.0,
    e: 0.18,
    rotY: 0,
    rotX: 0.04,
    rotZ: 0.02,
    camX: 0,
    camY: 0.2,
    camZ: 8,
    lookY: -0.15,
    scale: 1,
  },
  {
    s: 0.18,
    e: 0.35,
    rotY: 0.7,
    rotX: 0.16,
    rotZ: 0.08,
    camX: 0.8,
    camY: 0.4,
    camZ: 7.3,
    lookY: -0.05,
    scale: 1.05,
  },
  {
    s: 0.35,
    e: 0.55,
    rotY: 2.2,
    rotX: -0.08,
    rotZ: -0.05,
    camX: -0.7,
    camY: 0.45,
    camZ: 6.6,
    lookY: 0.05,
    scale: 1.08,
  },
  {
    s: 0.55,
    e: 0.75,
    rotY: Math.PI,
    rotX: 0.05,
    rotZ: 0,
    camX: 0,
    camY: 0.25,
    camZ: 7.4,
    lookY: -0.1,
    scale: 0.97,
  },
  {
    s: 0.75,
    e: 1.0,
    rotY: Math.PI * 1.9,
    rotX: 0.22,
    rotZ: 0.08,
    camX: 0.6,
    camY: 0.15,
    camZ: 6.8,
    lookY: -0.15,
    scale: 1.06,
  },
];

function smoothstep(a, b, x) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const clock = new THREE.Clock();

// -------------------------------------------------------
// Animation
// -------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  scroll += (scrollTarget - scroll) * 0.08;

  if (hero) {
    let A = poses[0];
    let B = poses[1];
    let t = 0;

    for (let i = 0; i < poses.length - 1; i++) {
      if (scroll >= poses[i].s && scroll <= poses[i].e) {
        A = poses[i];
        B = poses[i + 1];
        t = smoothstep(A.s, A.e, scroll);
        break;
      }
    }

    // ROTATE GROUP
    heroRig.rotation.x = THREE.MathUtils.lerp(A.rotX, B.rotX, t);
    heroRig.rotation.y = THREE.MathUtils.lerp(A.rotY, B.rotY, t);
    heroRig.rotation.z = THREE.MathUtils.lerp(A.rotZ, B.rotZ, t);

    // Tiny breathing motion.
    heroRig.position.y = Math.sin(clock.getElapsedTime() * 1.4) * 0.02;

    const scale = THREE.MathUtils.lerp(A.scale, B.scale, t);
    heroRig.scale.setScalar(scale);

    // CAMERA MOVEMENT (THIS IS THE MAGIC)
    camera.position.x = THREE.MathUtils.lerp(A.camX, B.camX, t);
    camera.position.y = THREE.MathUtils.lerp(A.camY, B.camY, t);
    camera.position.z = THREE.MathUtils.lerp(A.camZ, B.camZ, t);

    const lookY = THREE.MathUtils.lerp(A.lookY, B.lookY, t);
    camera.lookAt(0, lookY, 0);
  }

  renderer.render(scene, camera);
}

animate();

// -------------------------------------------------------
// Resize
// -------------------------------------------------------
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
