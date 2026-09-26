import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

// =====================================================
// Renderer
// =====================================================
const canvas = document.getElementById("heroCanvas")

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setClearColor(0xffffff, 0)

// =====================================================
// Scene
// =====================================================
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    100
)

camera.position.set(0, 0.1, 9)

// =====================================================
// Lights
// =====================================================
scene.add(new THREE.AmbientLight(0xffffff, 1.1))

const key = new THREE.DirectionalLight(0xffffff, 2.8)
key.position.set(5, 5, 5)
scene.add(key)

const rim = new THREE.DirectionalLight(0xff8ad8, 1.2)
rim.position.set(-5, 4, -4)
scene.add(rim)

const fill = new THREE.DirectionalLight(0x8ab8ff, 0.8)
fill.position.set(0, -3, 4)
scene.add(fill)

// =====================================================
// Model
// =====================================================
let hero = null
let scrollTarget = 0
let scroll = 0

new GLTFLoader().load(
    "./DaudHero.glb",
    (gltf) => {
        hero = gltf.scene

        // Correct size for your exported Blender model.
        hero.scale.setScalar(0.032)

        // Hero position.
        hero.position.set(0, -2.2, 0)

        // Face camera.
        hero.rotation.set(0.05, Math.PI, 0)

        scene.add(hero)

        console.log("DAUD HERO LOADED")
    },
    undefined,
    (e) => console.error(e)
)

// =====================================================
// Scroll bridge (Framer OR standalone)
// =====================================================
window.addEventListener("message", (event) => {
    if (event.data?.type === "scroll") {
        scrollTarget = THREE.MathUtils.clamp(event.data.progress, 0, 1)
    }
})

// Standalone fallback for Vercel.
window.addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - window.innerHeight
    if (h > 0) scrollTarget = window.scrollY / h
})

// =====================================================
// Timeline
// =====================================================
const poses = [
    { s:0.00,e:0.20,x:0.00,y:-2.20,rx:0.05,ry:Math.PI,rz:0.02,cam:9,scale:0.032 },
    { s:0.20,e:0.40,x:1.00,y:-2.00,rx:0.18,ry:Math.PI+0.55,rz:0.08,cam:8.2,scale:0.033 },
    { s:0.40,e:0.60,x:-0.90,y:-1.90,rx:-0.10,ry:Math.PI+1.9,rz:-0.05,cam:7.4,scale:0.034 },
    { s:0.60,e:0.80,x:0.20,y:-2.10,rx:0.05,ry:Math.PI*2,rz:0.04,cam:8.4,scale:0.031 },
    { s:0.80,e:1.00,x:-0.40,y:-2.05,rx:-0.12,ry:Math.PI*2.5,rz:0.05,cam:8.1,scale:0.033 },
]

function smooth(a, b, t) {
    t = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}

const clock = new THREE.Clock()

// =====================================================
// Animation loop
// =====================================================
function animate() {
    requestAnimationFrame(animate)

    scroll += (scrollTarget - scroll) * 0.08

    if (hero) {
        let A = poses[0]
        let B = poses[1]
        let t = 0

        for (let i = 0; i < poses.length - 1; i++) {
            if (scroll >= poses[i].s && scroll <= poses[i].e) {
                A = poses[i]
                B = poses[i + 1]
                t = smooth(A.s, A.e, scroll)
                break
            }
        }

        hero.position.x = THREE.MathUtils.lerp(A.x, B.x, t)
        hero.position.y = THREE.MathUtils.lerp(A.y, B.y, t)

        // Tiny idle motion.
        hero.position.y += Math.sin(clock.getElapsedTime() * 1.2) * 0.015

        hero.rotation.x = THREE.MathUtils.lerp(A.rx, B.rx, t)
        hero.rotation.y = THREE.MathUtils.lerp(A.ry, B.ry, t)
        hero.rotation.z = THREE.MathUtils.lerp(A.rz, B.rz, t)

        const s = THREE.MathUtils.lerp(A.scale, B.scale, t)
        hero.scale.setScalar(s)

        camera.position.z = THREE.MathUtils.lerp(A.cam, B.cam, t)
        camera.lookAt(0, -0.2, 0)
    }

    renderer.render(scene, camera)
}

animate()

// =====================================================
// Resize
// =====================================================
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
})
