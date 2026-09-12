import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"

// ==========================================================
// RENDERER
// ==========================================================

const canvas = document.getElementById("heroCanvas")

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000000, 0)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1

// ==========================================================
// SCENE
// ==========================================================

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)

camera.position.set(0, 0, 6)

// ==========================================================
// LIGHTING (same vibe as helmet demo)
// ==========================================================

scene.add(new THREE.AmbientLight(0xffffff, 0.45))

const key = new THREE.DirectionalLight(0xffffff, 2.8)
key.position.set(5, 6, 5)
scene.add(key)

const warm = new THREE.DirectionalLight(0xffd2b0, 1.2)
warm.position.set(-4, 2, -2)
scene.add(warm)

const cool = new THREE.DirectionalLight(0x88a6ff, 0.8)
cool.position.set(0, -3, 5)
scene.add(cool)

// ==========================================================
// HDR ENVIRONMENT
// ==========================================================

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = texture
  }
)

// ==========================================================
// MODEL
// ==========================================================

let mannequin = null
let idleOffsetY = 0

const loader = new GLTFLoader()

loader.load(
  "/DaudMannequin3js.glb",

  (gltf) => {
    mannequin = gltf.scene

    // Center model automatically
    const box = new THREE.Box3().setFromObject(mannequin)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    mannequin.position.sub(center)

    // Put feet near bottom of frame
    idleOffsetY = -size.y * 0.38
    mannequin.position.y += idleOffsetY

    // Scale based on model height
    const targetHeight = 3.3
    const scale = targetHeight / size.y
    mannequin.scale.setScalar(scale)

    // Face camera
    mannequin.rotation.y = Math.PI

    scene.add(mannequin)

    console.log("✅ Mannequin loaded", size)
  },

  undefined,

  (err) => {
    console.error("❌ Failed to load GLB", err)
  }
)

// ==========================================================
// HELMET TIMELINE
// ==========================================================

const poses = [
  {
    start: 0.0,
    end: 0.15,
    pos: new THREE.Vector3(0.35, 0, 0),
    rot: new THREE.Euler(0, 0, 0),
    cam: 6,
    scale: 1,
  },

  {
    start: 0.15,
    end: 0.35,
    pos: new THREE.Vector3(1.1, 0.15, 0),
    rot: new THREE.Euler(0.2, 0.8, 0.08),
    cam: 5.3,
    scale: 1.08,
  },

  {
    start: 0.35,
    end: 0.55,
    pos: new THREE.Vector3(-0.8, 0.25, 0),
    rot: new THREE.Euler(-0.12, 2.2, -0.05),
    cam: 4.9,
    scale: 1.15,
  },

  {
    start: 0.55,
    end: 0.7,
    pos: new THREE.Vector3(0, 0.05, 0),
    rot: new THREE.Euler(0, Math.PI, 0),
    cam: 6,
    scale: 0.95,
  },

  {
    start: 0.7,
    end: 0.85,
    pos: new THREE.Vector3(0.75, -0.1, 0),
    rot: new THREE.Euler(0.28, 4.5, 0.12),
    cam: 4.6,
    scale: 1.2,
  },

  {
    start: 0.85,
    end: 1.0,
    pos: new THREE.Vector3(-0.7, 0.1, 0),
    rot: new THREE.Euler(-0.15, Math.PI * 2, 0.05),
    cam: 5.6,
    scale: 1,
  },
]

// ==========================================================
// HELPERS
// ==========================================================

const lerp = THREE.MathUtils.lerp

function smoothstep(a, b, t) {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
  return x * x * (3 - 2 * x)
}

// ==========================================================
// SCROLL
// ==========================================================

let targetScroll = 0
let smoothScroll = 0

function updateScroll() {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight

  targetScroll = maxScroll > 0 ? window.scrollY / maxScroll : 0
}

updateScroll()

window.addEventListener("scroll", updateScroll, { passive: true })

// Future Framer support
window.addEventListener("message", (e) => {
  if (e.data?.type === "scroll") {
    targetScroll = e.data.progress
  }
})

// ==========================================================
// ANIMATION LOOP
// ==========================================================

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

    // POSITION
    mannequin.position.x = lerp(current.pos.x, next.pos.x, t)

    mannequin.position.y =
      idleOffsetY +
      lerp(current.pos.y, next.pos.y, t) +
      Math.sin(elapsed * 1.3) * 0.03

    mannequin.position.z = lerp(current.pos.z, next.pos.z, t)

    // ROTATION
    mannequin.rotation.x = lerp(current.rot.x, next.rot.x, t)

    mannequin.rotation.y =
      Math.PI +
      lerp(current.rot.y, next.rot.y, t) +
      Math.sin(elapsed * 0.55) * 0.05

    mannequin.rotation.z = lerp(current.rot.z, next.rot.z, t)

    // SCALE
    const scale = lerp(current.scale, next.scale, t)
    mannequin.scale.setScalar(
      (3.3 / 158) * scale // keeps automatic scaling consistent
    )

    // CAMERA
    camera.position.z = lerp(current.cam, next.cam, t)
    camera.lookAt(0, 0, 0)
  }

  renderer.render(scene, camera)
}

animate()

// ==========================================================
// RESIZE
// ==========================================================

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight)

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})
