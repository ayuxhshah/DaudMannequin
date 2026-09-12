import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"

const canvas = document.getElementById("heroCanvas")

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
renderer.setSize(window.innerWidth,window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
renderer.setClearColor(0x000000,0)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
 45,
 window.innerWidth/window.innerHeight,
 0.1,
 100
)

camera.position.set(0,0,3)


// ---------- LIGHTING ----------

scene.add(new THREE.AmbientLight(0xffffff,0.35))

const key = new THREE.DirectionalLight(0xffffff,2.8)
key.position.set(5,5,5)
scene.add(key)

const warm = new THREE.DirectionalLight(0xffd3aa,1.1)
warm.position.set(-4,2,-2)
scene.add(warm)

const cool = new THREE.DirectionalLight(0x87a6ff,0.9)
cool.position.set(0,-4,5)
scene.add(cool)


// ---------- HDR ----------

new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
  (texture)=>{
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = texture
  }
)


// ---------- MODEL ----------

let model = null

new GLTFLoader().load("./DaudMannequin3js.glb",(gltf)=>{

    model = gltf.scene

    // Initial offsets (will tweak once we inspect model)
    model.rotation.y = Math.PI
    model.position.set(0,-0.65,0)
    model.scale.setScalar(1.15)

    scene.add(model)

})


// ---------- TIMELINE ----------

const sections = [
 {s:0,e:0.15,p:[0.4,-0.65],r:[0,0,0],cam:3,scale:1.15},
 {s:0.15,e:0.35,p:[1.1,-0.55],r:[0.25,0.9,0.1],cam:2.65,scale:1.25},
 {s:0.35,e:0.55,p:[-0.8,-0.45],r:[-0.15,2.2,-0.05],cam:2.4,scale:1.32},
 {s:0.55,e:0.70,p:[0,-0.55],r:[0,Math.PI,0],cam:3,scale:1.1},
 {s:0.70,e:0.85,p:[0.8,-0.7],r:[0.3,4.5,0.15],cam:2.15,scale:1.4},
 {s:0.85,e:1,p:[-0.7,-0.55],r:[-0.15,Math.PI*2,0.05],cam:2.8,scale:1.2},
]

const lerp=(a,b,t)=>a+(b-a)*t

function smoothstep(a,b,t){
 let x=Math.max(0,Math.min(1,(t-a)/(b-a)))
 return x*x*(3-2*x)
}

let targetScroll=0
let scroll=0

window.addEventListener("scroll",()=>{

 const h=document.documentElement.scrollHeight-window.innerHeight
 targetScroll = h>0 ? window.scrollY/h : 0

})


// ---------- ANIMATE ----------

function animate(){

 requestAnimationFrame(animate)

 scroll += (targetScroll-scroll)*0.06

 if(model){

   let current=sections[0]
   let next=sections[1]
   let t=0

   for(let i=0;i<sections.length;i++){

      if(scroll>=sections[i].s && scroll<=sections[i].e){

         current=sections[i]
         next=sections[Math.min(i+1,sections.length-1)]
         t=smoothstep(current.s,current.e,scroll)
         break
      }

   }

   model.position.x = lerp(current.p[0],next.p[0],t)
   model.position.y = lerp(current.p[1],next.p[1],t)

   model.rotation.x = lerp(current.r[0],next.r[0],t)

   model.rotation.y =
      lerp(current.r[1],next.r[1],t)
      + Math.sin(Date.now()*0.0003)*0.05

   model.rotation.z = lerp(current.r[2],next.r[2],t)

   const s = lerp(current.scale,next.scale,t)
   model.scale.setScalar(s)

   camera.position.z = lerp(current.cam,next.cam,t)

 }

 renderer.render(scene,camera)

}

animate()


// ---------- RESIZE ----------

window.addEventListener("resize",()=>{

 camera.aspect = window.innerWidth/window.innerHeight
 camera.updateProjectionMatrix()

 renderer.setSize(window.innerWidth,window.innerHeight)

})