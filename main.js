import * as THREE from "https://esm.sh/three@0.163.0";
import { GLTFLoader } from "https://esm.sh/three@0.163.0/examples/jsm/loaders/GLTFLoader";

//
// -----------------------------------------------------
// CANVAS + RENDERER
// -----------------------------------------------------
//

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

//
// -----------------------------------------------------
// SCENE + CAMERA
// -----------------------------------------------------
//

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0.3, 8);

//
// -----------------------------------------------------
// LIGHTS
// -----------------------------------------------------
//

scene.add(new THREE.AmbientLight(0xffffff, 1));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xff8ad8, 1.2);
rimLight.position.set(-5, 3, -5);
scene.add(rimLight);

//
// -----------------------------------------------------
// HERO RIG
// -----------------------------------------------------
//

const heroRig = new THREE.Group();
scene.add(heroRig);

let hero = null;

//
// Scroll progress from Framer
//

let scrollTarget = 0;
let scroll = 0;

//
// -----------------------------------------------------
// LOAD GLB
// -----------------------------------------------------
//

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
    console.error("❌ GLB failed to load", error);
  }
);

//
// -----------------------------------------------------
// RECEIVE SCROLL FROM FRAMER
// -----------------------------------------------------
//

window.addEventListener("message", (event) => {
  if (event.data?.type === "scroll") {
    scrollTarget = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

//
// -----------------------------------------------------
// ANIMATION LOOP
// -----------------------------------------------------
//

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  scroll += (scrollTarget - scroll) * 0.08;

  if (hero) {
    const time = clock.getElapsedTime();

    // Scroll-driven rotation
    heroRig.rotation.y = scroll * Math.PI * 2;
    heroRig.rotation.x = Math.sin(scroll * Math.PI) * 0.15;
    heroRig.rotation.z = Math.sin(scroll * Math.PI * 2) * 0.05;

    // Floating idle motion
    heroRig.position.y = Math.sin(time * 1.4) * 0.03;

    camera.lookAt(0, -0.15, 0);
  }

  renderer.render(scene, camera);
}

animate();

//
// -----------------------------------------------------
// RESIZE
// -----------------------------------------------------
//

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
