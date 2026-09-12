import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const canvas = document.getElementById("heroCanvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(0, 0, 8);

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(5, 5, 5);
scene.add(key);

const warm = new THREE.DirectionalLight(0xffd0a8, 1.1);
warm.position.set(-3, 2, -2);
scene.add(warm);

const fill = new THREE.DirectionalLight(0x88a6ff, 0.8);
fill.position.set(0, -3, 4);
scene.add(fill);

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  }
);

let model = null;

new GLTFLoader().load("/DaudMannequin3js.glb", (gltf) => {
  model = gltf.scene;

  model.scale.setScalar(0.018);
  model.rotation.y = Math.PI;
  model.position.set(0, -1.45, 0);

  scene.add(model);
});

const poses = [
  { s: 0, e: 0.15, x: 0.4, y: -1.45, rx: 0, ry: 0, rz: 0, cam: 8, scale: 0.018 },
  { s: 0.15, e: 0.35, x: 1.3, y: -1.3, rx: 0.2, ry: 0.8, rz: 0.08, cam: 7.2, scale: 0.0195 },
  { s: 0.35, e: 0.55, x: -0.8, y: -1.15, rx: -0.1, ry: 2.2, rz: -0.05, cam: 6.8, scale: 0.021 },
  { s: 0.55, e: 0.7, x: 0, y: -1.3, rx: 0, ry: Math.PI, rz: 0, cam: 8, scale: 0.0175 },
  { s: 0.7, e: 0.85, x: 0.8, y: -1.55, rx: 0.3, ry: 4.5, rz: 0.12, cam: 6.5, scale: 0.0225 },
  { s: 0.85, e: 1, x: -0.7, y: -1.35, rx: -0.15, ry: Math.PI * 2, rz: 0.05, cam: 7.4, scale: 0.019 },
];

const lerp = THREE.MathUtils.lerp;

function smoothstep(a, b, t) {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

// ------------------------------------------------------------
// THIS IS NOW DRIVEN BY FRAMER
// ------------------------------------------------------------

let targetScroll = 0;
let smoothScroll = 0;

window.addEventListener("message", (event) => {
  if (event.data?.type === "scroll") {
    targetScroll = THREE.MathUtils.clamp(event.data.progress, 0, 1);
  }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  smoothScroll += (targetScroll - smoothScroll) * 0.08;

  if (model) {
    let current = poses[0];
    let next = poses[1];
    let t = 0;

    for (let i = 0; i < poses.length; i++) {
      if (smoothScroll >= poses[i].s && smoothScroll <= poses[i].e) {
        current = poses[i];
        next = poses[Math.min(i + 1, poses.length - 1)];
        t = smoothstep(current.s, current.e, smoothScroll);
        break;
      }
    }

    model.position.x = lerp(current.x, next.x, t);
    model.position.y =
      lerp(current.y, next.y, t) + Math.sin(elapsed * 1.3) * 0.03;

    model.rotation.x = lerp(current.rx, next.rx, t);

    model.rotation.y =
      Math.PI +
      lerp(current.ry, next.ry, t) +
      Math.sin(elapsed * 0.55) * 0.05;

    model.rotation.z = lerp(current.rz, next.rz, t);

    model.scale.setScalar(lerp(current.scale, next.scale, t));

    camera.position.z = lerp(current.cam, next.cam, t);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
