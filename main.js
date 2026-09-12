import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// ============================================================
// Renderer
// ============================================================

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("heroCanvas"),
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// ============================================================
// Scene + Camera
// ============================================================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0, 6);

// ============================================================
// Lights
// ============================================================

scene.add(new THREE.AmbientLight(0xffffff, 0.45));

const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(5, 5, 5);
scene.add(key);

const warm = new THREE.DirectionalLight(0xffd2b0, 1.2);
warm.position.set(-4, 2, -2);
scene.add(warm);

const cool = new THREE.DirectionalLight(0x88a6ff, 0.8);
cool.position.set(0, -3, 5);
scene.add(cool);

// ============================================================
// HDRI
// ============================================================

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
  (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr;
  }
);

// ============================================================
// Model
// ============================================================

let mannequin;
let baseScale = 1;
let baseY = 0;

new GLTFLoader().load(
  "/DaudMannequin3js.glb",

  (gltf) => {
    mannequin = gltf.scene;

    // Bounding box
    const box = new THREE.Box3().setFromObject(mannequin);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center pivot
    mannequin.position.sub(center);

    // Scale model to 3.4 world units tall
    baseScale = 3.4 / size.y;
    mannequin.scale.setScalar(baseScale);

    // Put feet near bottom of viewport
    baseY = -(size.y * baseScale) * 0.42;
    mannequin.position.y = baseY;

    // Face camera
    mannequin.rotation.y = Math.PI;

    scene.add(mannequin);

    console.log("Model loaded", size);
  },

  undefined,

  console.error
);

// ============================================================
// Scroll poses (helmet demo)
// ============================================================

const poses = [
  { s: 0.0, e: 0.15, x: 0.35, y: 0.0, rx: 0, ry: 0, rz: 0, cam: 6, scale: 1.0 },
  { s: 0.15, e: 0.35, x: 1.1, y: 0.12, rx: 0.2, ry: 0.8, rz: 0.08, cam: 5.2, scale: 1.08 },
  { s: 0.35, e: 0.55, x: -0.8, y: 0.22, rx: -0.12, ry: 2.2, rz: -0.05, cam: 4.8, scale: 1.15 },
  { s: 0.55, e: 0.70, x: 0, y: 0.05, rx: 0, ry: Math.PI, rz: 0, cam: 6, scale: 0.95 },
  { s: 0.70, e: 0.85, x: 0.8, y: -0.08, rx: 0.28, ry: 4.5, rz: 0.12, cam: 4.6, scale: 1.2 },
  { s: 0.85, e: 1.0, x: -0.7, y: 0.1, rx: -0.15, ry: Math.PI * 2, rz: 0.05, cam: 5.4, scale: 1.0 },
];

const lerp = THREE.MathUtils.lerp;

const smoothstep = (a, b, t) => {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

// ============================================================
// Scroll
// ============================================================

let targetScroll = 0;
let scrollProgress = 0;

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetScroll = max > 0 ? window.scrollY / max : 0;
}

updateScroll();

window.addEventListener("scroll", updateScroll, { passive: true });

// Framer support later
window.addEventListener("message", (e) => {
  if (e.data?.type === "scroll") {
    targetScroll = e.data.progress;
  }
});

// ============================================================
// Animate
// ============================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  scrollProgress += (targetScroll - scrollProgress) * 0.06;

  if (mannequin) {
    const time = clock.getElapsedTime();

    let a = poses[0];
    let b = poses[1];
    let t = 0;

    for (let i = 0; i < poses.length; i++) {
      if (scrollProgress >= poses[i].s && scrollProgress <= poses[i].e) {
        a = poses[i];
        b = poses[Math.min(i + 1, poses.length - 1)];
        t = smoothstep(a.s, a.e, scrollProgress);
        break;
      }
    }

    // Position
    mannequin.position.x = lerp(a.x, b.x, t);
    mannequin.position.y =
      baseY +
      lerp(a.y, b.y, t) +
      Math.sin(time * 1.2) * 0.03;

    // Rotation
    mannequin.rotation.x = lerp(a.rx, b.rx, t);

    mannequin.rotation.y =
      Math.PI +
      lerp(a.ry, b.ry, t) +
      Math.sin(time * 0.5) * 0.04;

    mannequin.rotation.z = lerp(a.rz, b.rz, t);

    // Scale (IMPORTANT — use baseScale, don't hardcode 158)
    const scale = lerp(a.scale, b.scale, t);
    mannequin.scale.setScalar(baseScale * scale);

    // Camera
    camera.position.z = lerp(a.cam, b.cam, t);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();

// ============================================================
// Resize
// ============================================================

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
