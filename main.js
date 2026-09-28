import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ----------------------------------------------------
// Canvas + Renderer
// ----------------------------------------------------

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

// ----------------------------------------------------
// Scene
// ----------------------------------------------------

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0.3, 8);

// ----------------------------------------------------
// Lights
// ----------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 1));

const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(5, 5, 5);
scene.add(key);

const rim = new THREE.DirectionalLight(0xff8ad8, 1.2);
rim.position.set(-5, 3, -5);
scene.add(rim);

// ----------------------------------------------------
// Hero Rig
// ----------------------------------------------------

const heroRig = new THREE.Group();
scene.add(heroRig);

let hero = null;

// Scroll value (0 → 1)
let scrollTarget = 0;
let scroll = 0;

// ----------------------------------------------------
// Load Model
// ----------------------------------------------------

const loader = new GLTFLoader();

loader.load(
  "./DaudHero.glb",

  (gltf) => {
    hero = gltf.scene;

    hero.scale.setScalar(0.031);
    hero.position.set(0, -2.35, 0);
    hero.rotation.y = Math.PI;

    hero.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    heroRig.add(hero);

    console.log("✅ GLB Loaded");
  },

  undefined,

  (error) => {
    console.error("❌ Failed to load GLB", error);
  }
);

// ----------------------------------------------------
// Receive scroll from Framer
// ----------------------------------------------------

window.addEventListener("message", (event) => {
  if (event.data?.type === "scroll") {
    scrollTarget = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

// ----------------------------------------------------
// Animation
// ----------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  scroll += (scrollTarget - scroll) * 0.08;

  if (hero) {
    const time = clock.getElapsedTime();

    // Rotation driven by scroll
    heroRig.rotation.y = scroll * Math.PI * 2;
    heroRig.rotation.x = Math.sin(scroll * Math.PI) * 0.15;
    heroRig.rotation.z = Math.sin(scroll * Math.PI * 2) * 0.05;

    // Floating animation
    heroRig.position.y = Math.sin(time * 1.4) * 0.03;

    camera.lookAt(0, -0.15, 0);
  }

  renderer.render(scene, camera);
}

animate();

// ----------------------------------------------------
// Resize
// ----------------------------------------------------

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
