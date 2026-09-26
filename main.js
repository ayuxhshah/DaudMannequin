import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.170/examples/jsm/loaders/RGBELoader.js";

// ----------------------------------------------------
// Renderer
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
renderer.toneMappingExposure = 1.15;

// ----------------------------------------------------
// Scene + Camera
// ----------------------------------------------------

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

// This framing works for your exported mannequin.
camera.position.set(0, 0.1, 5.8);

// ----------------------------------------------------
// Lights
// ----------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(5, 6, 5);
scene.add(key);

const rimPink = new THREE.DirectionalLight(0xff86dc, 2);
rimPink.position.set(-6, 4, -5);
scene.add(rimPink);

const fillBlue = new THREE.DirectionalLight(0x8db5ff, 1);
fillBlue.position.set(0, -3, 5);
scene.add(fillBlue);

// Optional HDR reflections
new RGBELoader().load(
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
    (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = hdr;
    }
);

// ----------------------------------------------------
// Hero Model
// ----------------------------------------------------

let hero = null;
let targetScroll = 0;
let smoothScroll = 0;

const loader = new GLTFLoader();

loader.load(
    "/DaudHero.glb",
    (gltf) => {
        hero = gltf.scene;

        // ---------- SCALE ----------
        hero.scale.set(0.045, 0.045, 0.045);

        // ---------- POSITION ----------
        hero.position.set(0, -2.55, 0);

        // ---------- START ROTATION ----------
        hero.rotation.set(0.05, Math.PI, 0.02);

        scene.add(hero);

        console.log("DAUD HERO LOADED");
    },
    undefined,
    (err) => {
        console.error(err);
    }
);

// ----------------------------------------------------
// Scroll Timeline
// ----------------------------------------------------

const poses = [
    {
        start: 0.0,
        end: 0.18,
        pos: new THREE.Vector3(0, -2.55, 0),
        rot: new THREE.Euler(0.05, Math.PI, 0.02),
        cam: 5.8,
        scale: 0.045,
    },

    {
        start: 0.18,
        end: 0.35,
        pos: new THREE.Vector3(1.0, -2.2, 0),
        rot: new THREE.Euler(0.25, Math.PI + 0.65, 0.08),
        cam: 5.4,
        scale: 0.047,
    },

    {
        start: 0.35,
        end: 0.55,
        pos: new THREE.Vector3(-0.9, -2.0, 0),
        rot: new THREE.Euler(-0.18, Math.PI + 2.0, -0.08),
        cam: 5.0,
        scale: 0.049,
    },

    {
        start: 0.55,
        end: 0.72,
        pos: new THREE.Vector3(0, -2.35, 0),
        rot: new THREE.Euler(0.02, Math.PI * 2, 0),
        cam: 5.5,
        scale: 0.044,
    },

    {
        start: 0.72,
        end: 0.88,
        pos: new THREE.Vector3(0.9, -2.25, 0),
        rot: new THREE.Euler(0.32, Math.PI * 2 + 1.1, 0.15),
        cam: 4.9,
        scale: 0.051,
    },

    {
        start: 0.88,
        end: 1.0,
        pos: new THREE.Vector3(-0.45, -2.3, 0),
        rot: new THREE.Euler(-0.18, Math.PI * 3, 0.04),
        cam: 5.3,
        scale: 0.046,
    },
];

// ----------------------------------------------------
// Framer ScrollBridge
// ----------------------------------------------------

window.addEventListener("message", (event) => {
    if (event.data?.type === "scroll") {
        targetScroll = THREE.MathUtils.clamp(event.data.progress, 0, 1);
    }
});

// ----------------------------------------------------
// Animation Helpers
// ----------------------------------------------------

function smoothstep(edge0, edge1, x) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

const clock = new THREE.Clock();

// ----------------------------------------------------
// Animate
// ----------------------------------------------------

function animate() {
    requestAnimationFrame(animate);

    smoothScroll += (targetScroll - smoothScroll) * 0.08;

    if (hero) {
        const t = clock.getElapsedTime();

        let current = poses[0];
        let next = poses[1];
        let progress = 0;

        for (let i = 0; i < poses.length - 1; i++) {
            if (
                smoothScroll >= poses[i].start &&
                smoothScroll <= poses[i].end
            ) {
                current = poses[i];
                next = poses[i + 1];
                progress = smoothstep(
                    current.start,
                    current.end,
                    smoothScroll
                );
                break;
            }
        }

        hero.position.lerpVectors(current.pos, next.pos, progress);

        // Tiny idle float.
        hero.position.y += Math.sin(t * 1.4) * 0.015;

        hero.rotation.x = THREE.MathUtils.lerp(
            current.rot.x,
            next.rot.x,
            progress
        );

        hero.rotation.y = THREE.MathUtils.lerp(
            current.rot.y,
            next.rot.y,
            progress
        );

        hero.rotation.z = THREE.MathUtils.lerp(
            current.rot.z,
            next.rot.z,
            progress
        );

        const s = THREE.MathUtils.lerp(
            current.scale,
            next.scale,
            progress
        );

        hero.scale.setScalar(s);

        camera.position.z = THREE.MathUtils.lerp(
            current.cam,
            next.cam,
            progress
        );

        camera.lookAt(0, -0.25, 0);
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
