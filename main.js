import * as THREE from "https://esm.sh/three@0.163.0";
import { GLTFLoader } from "https://esm.sh/three@0.163.0/examples/jsm/loaders/GLTFLoader";

// ------------------------------------------
// Renderer
// ------------------------------------------
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

// ------------------------------------------
// Scene
// ------------------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

scene.add(new THREE.AmbientLight(0xffffff, 1));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xff8ad8, 1.2);
rimLight.position.set(-5, 3, -5);
scene.add(rimLight);

// ------------------------------------------
// Hero
// ------------------------------------------
const heroRig = new THREE.Group();
scene.add(heroRig);

let hero = null;

new GLTFLoader().load("./DaudHero.glb", (gltf) => {
  hero = gltf.scene;

  hero.scale.setScalar(0.031);
  hero.position.set(0, -2.35, 0);
  hero.rotation.y = Math.PI;

  heroRig.add(hero);

  console.log("✅ GLB Loaded");
});

// ------------------------------------------
// Camera Timeline (7 Sections)
// ------------------------------------------

const cameraStates = [
  {
    position: new THREE.Vector3(0, 0.3, 8),
    target: new THREE.Vector3(0, -0.15, 0),
  },
  {
    position: new THREE.Vector3(0.9, -0.5, 6),
    target: new THREE.Vector3(0, -1.4, 0),
  },
  {
    position: new THREE.Vector3(-2.2, 0.3, 5.5),
    target: new THREE.Vector3(0, -0.3, 0),
  },
  {
    position: new THREE.Vector3(2.1, 0.8, 4.6),
    target: new THREE.Vector3(0, 0.1, 0),
  },
  {
    position: new THREE.Vector3(0, 1.6, 4),
    target: new THREE.Vector3(0, 0.5, 0),
  },
  {
    position: new THREE.Vector3(-1.2, 0.6, 5.3),
    target: new THREE.Vector3(0, -0.4, 0),
  },
  {
    position: new THREE.Vector3(0, 0.45, 3.9),
    target: new THREE.Vector3(0, 0.2, 0),
  },
];

let activeSection = 0;
let sectionProgress = 0;

const lookTarget = new THREE.Vector3();

// ------------------------------------------
// Listen for Framer
// ------------------------------------------

window.addEventListener("message", (event) => {
  if (event.origin !== "https://most-otter-554870.framer.app") return;

  if (event.data?.type === "camera") {
    activeSection = Math.max(
      0,
      Math.min(event.data.section, cameraStates.length - 1)
    );

    sectionProgress = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

// ------------------------------------------
// Animation
// ------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const from = cameraStates[activeSection];
  const to = cameraStates[Math.min(activeSection + 1, cameraStates.length - 1)];

  camera.position.lerpVectors(from.position, to.position, sectionProgress);

  lookTarget.lerpVectors(from.target, to.target, sectionProgress);

  camera.lookAt(lookTarget);

  if (hero) {
    const t = clock.getElapsedTime();

    heroRig.position.y = Math.sin(t * 1.4) * 0.03;
    heroRig.rotation.z = Math.sin(t * 0.8) * 0.015;
  }

  renderer.render(scene, camera);
}

animate();

// ------------------------------------------
// Resize
// ------------------------------------------
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
