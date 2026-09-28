import * as THREE from "https://esm.sh/three@0.163.0";
import { GLTFLoader } from "https://esm.sh/three@0.163.0/examples/jsm/loaders/GLTFLoader";

// -----------------------------------------------------
// CANVAS + RENDERER
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

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xff8ad8, 1.2);
rimLight.position.set(-5, 3, -5);
scene.add(rimLight);

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

        console.log("✅ GLB Loaded");
    },
    undefined,
    (error) => {
        console.error("❌ Failed to load GLB", error);
    }
);

// -----------------------------------------------------
// GLOBAL SCROLL FROM FRAMER
// -----------------------------------------------------

let globalProgress = 0;
let smoothProgress = 0;

window.addEventListener("message", (event) => {
    if (event.data?.type === "scroll") {
        globalProgress = THREE.MathUtils.clamp(event.data.progress, 0, 1);
    }
});

// -----------------------------------------------------
// CAMERA ORBIT KEYFRAMES (7 SECTIONS)
// -----------------------------------------------------

const cameraStates = [
    { azimuth: 180, elevation: 8, distance: 8.2 },   // Hero
    { azimuth: 145, elevation: -12, distance: 5.8 },  // Service
    { azimuth: 90, elevation: 0, distance: 5.3 },     // About
    { azimuth: 35, elevation: 12, distance: 4.8 },    // Project
    { azimuth: 0, elevation: 20, distance: 4.4 },     // Testimonials
    { azimuth: -60, elevation: 8, distance: 5.0 },    // FAQ
    { azimuth: -180, elevation: 10, distance: 4.1 },  // Contact
];

const lookTarget = new THREE.Vector3(0, -0.25, 0);
const tempCameraPosition = new THREE.Vector3();

function sphericalToCartesian(azimuth, elevation, distance) {
    const theta = THREE.MathUtils.degToRad(azimuth);
    const phi = THREE.MathUtils.degToRad(90 - elevation);

    tempCameraPosition.setFromSphericalCoords(distance, phi, theta);
}

// -----------------------------------------------------
// ANIMATION LOOP
// -----------------------------------------------------

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Smooth incoming scroll from Framer
    smoothProgress += (globalProgress - smoothProgress) * 0.08;

    // Split full page into camera chapters
    const chapters = cameraStates.length - 1;
    const timeline = smoothProgress * chapters;

    const currentSection = Math.min(
        Math.floor(timeline),
        chapters - 1
    );

    const sectionProgress = timeline - currentSection;

    const from = cameraStates[currentSection];
    const to = cameraStates[currentSection + 1];

    const azimuth = THREE.MathUtils.lerp(
        from.azimuth,
        to.azimuth,
        sectionProgress
    );

    const elevation = THREE.MathUtils.lerp(
        from.elevation,
        to.elevation,
        sectionProgress
    );

    const distance = THREE.MathUtils.lerp(
        from.distance,
        to.distance,
        sectionProgress
    );

    sphericalToCartesian(azimuth, elevation, distance);

    camera.position.lerp(tempCameraPosition, 0.12);
    camera.lookAt(lookTarget);

    // Idle breathing animation
    if (hero) {
        const t = clock.getElapsedTime();

        heroRig.position.y = Math.sin(t * 1.4) * 0.03;
        heroRig.rotation.z = Math.sin(t * 0.8) * 0.015;
    }

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
