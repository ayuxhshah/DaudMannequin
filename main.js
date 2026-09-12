import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"

// --------------------------------------------------
// RENDERER
// --------------------------------------------------

const canvas = document.getElementById("heroCanvas")

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setClearColor(0x000000, 0)

// --------------------------------------------------
// SCENE + CAMERA
// --------------------------------------------------

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)

camera.position.set(0, 0, 3)

// --------------------------------------------------
// LIGHTING
// --------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 0.35))

const key = new THREE.DirectionalLight(0xffffff, 2.6)
key.position.set(5, 5, 5)
scene.add(key)

const warm = new THREE.DirectionalLight(0xffd0a8, 1.2)
warm.position.set(-4, 2, -2)
scene.add(warm)

const cool = new THREE.DirectionalLight(0x88a6ff, 0.8)
cool.position.set(0, -3, 4)
scene.add(cool)

// --------------------------------------------------
// HDR ENVIRONMENT
// --------------------------------------------------

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = texture
  }
)

// --------------------------------------------------
// MODEL
// --------------------------------------------------

let mannequin = null

new GLTFLoader().load("./DaudMannequin3js.glb", (gltf) => {
  mannequin = gltf.scene

  // Initial orientation (Blender export)
  mannequin.rotation.y = Math.PI

  // Initial framing
  mannequin.position.set(0, -0.55, 0)

  mannequin.scale.setScalar(1.15)

  scene.add(mannequin)
})

// --------------------------------------------------
// POSES (same choreography as helmet demo)
// --------------------------------------------------

const poses = [
  { start: 0.0, end: 0.15, x: 0.35, y: -0.55, rx: 0, ry: 0, rz: 0, cam: 3.0, scale: 1.15 },

  { start: 0.15, end: 0.35, x: 1.15, y: -0.45, rx: 0.2, ry: 0.8, rz: 0.08, cam: 2.6, scale: 1.28 },

  { start: 0.35, end: 0.55, x: -0.8, y: -0.35, rx: -0.12, ry: 2.2, rz: -0.05, cam: 2.35, scale: 1.36 },

  { start: 0.55, end: 0.70, x: 0, y: -0.45, rx: 0, ry: Math.PI, rz: 0, cam: 3.0, scale: 1.1 },

  { start: 0.70, end: 0.85, x: 0.8, y: -0.65, rx: 0.3, ry: 4.5, rz: 0.12, cam: 2.2, scale: 1.42 },

  { start: 0.85, end: 1.0, x: -0.7, y: -0.45, rx: -0.15, ry: Math.PI * 2, rz: 0.05, cam: 2.75, scale: 1.2 },
]

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const lerp = (a, b, t) => a + (b - a) * t

const smoothstep = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

// --------------------------------------------------
// SCROLL (BUTTERY SMOOTH)
// --------------------------------------------------

let targetScroll = 0
let smoothScroll = 0

function updateScroll() {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight

  targetScroll = maxScroll > 0 ? window.scrollY / maxScroll : 0
}

updateScroll()

window.addEventListener("scroll", updateScroll, {
  passive: true,
})

// --------------------------------------------------
// ANIMATION LOOP
// --------------------------------------------------

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)

  const elapsed = clock.getElapsedTime()

  // Same smoothing as Aethon demo
  smoothScroll += (targetScroll - smoothScroll) * 0.06

  if (mannequin) {
    let current = poses[0]
    let next = poses[1]
    let t = 0

    for (let i = 0; i < poses.length; i++) {
      if (
        smoothScroll >= poses[i].start &&
        smoothScroll <= poses[i].end
      ) {
        current = poses[i]
        next = poses[Math.min(i + 1, poses.length - 1)]

        t = smoothstep(current.start, current.end, smoothScroll)
        break
      }
    }

    mannequin.position.x = lerp(current.x, next.x, t)
    mannequin.position.y = lerp(current.y, next.y, t)

    mannequin.rotation.x = lerp(current.rx, next.rx, t)

    mannequin.rotation.y =
      lerp(current.ry, next.ry, t) +
      Math.sin(elapsed * 0.6) * 0.05

    mannequin.rotation.z = lerp(current.rz, next.rz, t)

    const scale = lerp(current.scale, next.scale, t)
    mannequin.scale.setScalar(scale)

    camera.position.z = lerp(current.cam, next.cam, t)
  }

  renderer.render(scene, camera)
}

animate()

// --------------------------------------------------
// RESIZE
// --------------------------------------------------

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
})
