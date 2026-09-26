import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"

// ============================================================
// Renderer
// ============================================================
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("heroCanvas"),
  antialias: true,
  alpha: true,
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15
renderer.setClearColor(0x000000, 0)

// ============================================================
// Scene
// ============================================================
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)

camera.position.set(0, 0.3, 8)

// ============================================================
// Lights
// ============================================================
scene.add(new THREE.AmbientLight(0xffffff, 0.45))

const key = new THREE.DirectionalLight(0xffffff, 3)
key.position.set(5, 5, 5)
scene.add(key)

const rim = new THREE.DirectionalLight(0xff91df, 1.8)
rim.position.set(-4, 5, -5)
scene.add(rim)

const fill = new THREE.DirectionalLight(0x86a9ff, 0.9)
fill.position.set(0, -4, 5)
scene.add(fill)

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
  (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = hdr
  }
)

// ============================================================
// Model
// ============================================================
let hero
let heroScale = 1
let baseY = 0

new GLTFLoader().load("/DaudHero.glb", (gltf) => {
  hero = gltf.scene

  // Calculate size automatically
  const box = new THREE.Box3().setFromObject(hero)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  // Center model around chest.
  hero.position.sub(center)

  // Bigger hero.
  heroScale = 5.2 / size.y
  hero.scale.setScalar(heroScale)

  // Place body slightly lower.
  baseY = -(size.y * heroScale) * 0.28
  hero.position.y = baseY

  // Face camera.
  hero.rotation.y = Math.PI

  scene.add(hero)

  console.log("Hero Loaded", size)
})

// ============================================================
// Scroll Timeline
// ============================================================
const poses = [
  { s:0, e:.18, x:0.25, y:0, rx:.05, ry:0, rz:.02, cam:8.2, scale:1 },
  { s:.18,e:.35,x:1.15,y:.18,rx:.25,ry:.65,rz:.08,cam:7.2,scale:1.08 },
  { s:.35,e:.55,x:-.75,y:.28,rx:-.18,ry:2.0,rz:-.08,cam:6.6,scale:1.15 },
  { s:.55,e:.72,x:0,y:.05,rx:0,ry:Math.PI,rz:0,cam:7.6,scale:.97 },
  { s:.72,e:.87,x:.8,y:-.08,rx:.32,ry:4.4,rz:.14,cam:6.3,scale:1.2 },
  { s:.87,e:1,x:-.55,y:.12,rx:-.2,ry:Math.PI*2,rz:.06,cam:7,scale:1.05 }
]

const lerp = THREE.MathUtils.lerp

function smoothstep(a,b,t){
  const x = THREE.MathUtils.clamp((t-a)/(b-a),0,1)
  return x*x*(3-2*x)
}

// ============================================================
// Framer Scroll Bridge
// ============================================================
let targetScroll = 0
let scroll = 0

window.addEventListener("message", (event)=>{
  if(event.data?.type === "scroll"){
    targetScroll = THREE.MathUtils.clamp(event.data.progress,0,1)
  }
})

const clock = new THREE.Clock()

// ============================================================
// Animation Loop
// ============================================================
function animate(){
  requestAnimationFrame(animate)

  scroll += (targetScroll-scroll)*0.08

  if(hero){
    const time = clock.getElapsedTime()

    let a = poses[0]
    let b = poses[1]
    let t = 0

    for(let i=0;i<poses.length;i++){
      if(scroll>=poses[i].s && scroll<=poses[i].e){
        a=poses[i]
        b=poses[Math.min(i+1,poses.length-1)]
        t=smoothstep(a.s,a.e,scroll)
        break
      }
    }

    hero.position.x = lerp(a.x,b.x,t)
    hero.position.y = baseY + lerp(a.y,b.y,t) + Math.sin(time*1.6)*0.03

    hero.rotation.x = lerp(a.rx,b.rx,t)

    hero.rotation.y = Math.PI + lerp(a.ry,b.ry,t) + Math.sin(time*.5)*0.03

    hero.rotation.z = lerp(a.rz,b.rz,t)

    hero.scale.setScalar(heroScale*lerp(a.scale,b.scale,t))

    camera.position.z = lerp(a.cam,b.cam,t)
    camera.lookAt(0,0.15,0)
  }

  renderer.render(scene,camera)
}

animate()

// ============================================================
// Resize
// ============================================================
window.addEventListener("resize",()=>{
  renderer.setSize(window.innerWidth,window.innerHeight)
  camera.aspect = window.innerWidth/window.innerHeight
  camera.updateProjectionMatrix()
})
