import * as THREE from "https://esm.sh/three@0.163.0"
import { GLTFLoader } from "https://esm.sh/three@0.163.0/examples/jsm/loaders/GLTFLoader"

// -----------------------------------------------------
// CANVAS + RENDERER
// -----------------------------------------------------

const canvas = document.getElementById("heroCanvas")

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

// -----------------------------------------------------
// SCENE
// -----------------------------------------------------

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    32,
    window.innerWidth / window.innerHeight,
    0.1,
    100
)

// -----------------------------------------------------
// LIGHTS
// -----------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 1))

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
keyLight.position.set(5, 5, 5)
scene.add(keyLight)

const rimLight = new THREE.DirectionalLight(0xff8ad8, 1.2)
rimLight.position.set(-5, 3, -5)
scene.add(rimLight)

// -----------------------------------------------------
// HERO MODEL
// -----------------------------------------------------

const heroRig = new THREE.Group()
scene.add(heroRig)

let hero = null

new GLTFLoader().load(
    "./DaudHero.glb",
    (gltf) => {
        hero = gltf.scene

        hero.scale.setScalar(0.031)
        hero.position.set(0, -2.35, 0)
        hero.rotation.y = Math.PI

        heroRig.add(hero)

        console.log("✅ GLB Loaded")
    },
    undefined,
    (error) => {
        console.error("❌ Failed to load GLB", error)
    }
)

// -----------------------------------------------------
// GLOBAL SCROLL FROM FRAMER
// -----------------------------------------------------

let globalProgress = 0
let smoothProgress = 0

window.addEventListener("message", (event) => {
    if (event.data?.type === "scroll") {
        globalProgress = THREE.MathUtils.clamp(event.data.progress, 0, 1)
    }
})

// -----------------------------------------------------
// CAMERA KEYFRAMES (7 SECTIONS)
// -----------------------------------------------------

const cameraStates = [
    // Hero
    {
        position: new THREE.Vector3(0, 0.3, 8),
        target: new THREE.Vector3(0, -0.15, 0),
    },

    // Service
    {
        position: new THREE.Vector3(1.2, -0.55, 6.2),
        target: new THREE.Vector3(0, -1.2, 0),
    },

    // About
    {
        position: new THREE.Vector3(-2.2, 0.25, 5.5),
        target: new THREE.Vector3(0, -0.2, 0),
    },

    // Project
    {
        position: new THREE.Vector3(2.1, 0.85, 4.7),
        target: new THREE.Vector3(0, 0.15, 0),
    },

    // Testimonials
    {
        position: new THREE.Vector3(0, 1.55, 4.1),
        target: new THREE.Vector3(0, 0.55, 0),
    },

    // FAQ
    {
        position: new THREE.Vector3(-1.3, 0.55, 5.2),
        target: new THREE.Vector3(0, -0.35, 0),
    },

    // Contact
    {
        position: new THREE.Vector3(0, 0.45, 3.9),
        target: new THREE.Vector3(0, 0.2, 0),
    },
]

const lookTarget = new THREE.Vector3()

// -----------------------------------------------------
// ANIMATION LOOP
// -----------------------------------------------------

const clock = new THREE.Clock()

function animate() {
    requestAnimationFrame(animate)

    // Smooth incoming scroll
    smoothProgress += (globalProgress - smoothProgress) * 0.08

    // Split page into camera chapters
    const chapters = cameraStates.length - 1

    const timeline = smoothProgress * chapters

    const currentSection = Math.min(
        Math.floor(timeline),
        chapters - 1
    )

    const sectionProgress = timeline - currentSection

    const from = cameraStates[currentSection]
    const to = cameraStates[currentSection + 1]

    // Camera interpolation
    camera.position.lerpVectors(
        from.position,
        to.position,
        sectionProgress
    )

    lookTarget.lerpVectors(
        from.target,
        to.target,
        sectionProgress
    )

    camera.lookAt(lookTarget)

    // Idle motion only
    if (hero) {
        const t = clock.getElapsedTime()

        heroRig.position.y = Math.sin(t * 1.4) * 0.03
        heroRig.rotation.z = Math.sin(t * 0.8) * 0.015
    }

    renderer.render(scene, camera)
}

animate()

// -----------------------------------------------------
// RESIZE
// -----------------------------------------------------

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight)

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
})
