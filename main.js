import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("heroCanvas"),
  antialias: true,
  alpha: true
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
renderer.setSize(window.innerWidth,window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setClearColor(0x000000,0)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
 45,
 window.innerWidth/window.innerHeight,
 0.1,
 100
)

camera.position.z = 3

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff,.35))

const key = new THREE.DirectionalLight(0xffffff,2.5)
key.position.set(5,5,5)
scene.add(key)

const warm = new THREE.DirectionalLight(0xffd0a8,1.1)
warm.position.set(-4,2,-2)
scene.add(warm)

const fill = new THREE.DirectionalLight(0x88a6ff,.8)
fill.position.set(0,-3,4)
scene.add(fill)

// HDR
new RGBELoader().load(
 "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/citrus_orchard_road_puresky_1k.hdr",
 texture=>{
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture
 }
)

let model

new GLTFLoader().load("./DaudMannequin3js.glb",(gltf)=>{

 model = gltf.scene

 // Initial pose
 model.rotation.y = Math.PI
 model.position.y = -0.55
 model.scale.setScalar(1.15)

 scene.add(model)

})

const poses = [
 {s:0,e:.15,x:.35,y:-.55,rx:0,ry:0,rz:0,z:3,scale:1.15},
 {s:.15,e:.35,x:1.1,y:-.45,rx:.2,ry:.8,rz:.08,z:2.6,scale:1.25},
 {s:.35,e:.55,x:-.8,y:-.35,rx:-.1,ry:2.2,rz:-.05,z:2.35,scale:1.35},
 {s:.55,e:.70,x:0,y:-.45,rx:0,ry:Math.PI,rz:0,z:3,scale:1.12},
 {s:.70,e:.85,x:.8,y:-.6,rx:.3,ry:4.5,rz:.1,z:2.2,scale:1.45},
 {s:.85,e:1,x:-.7,y:-.45,rx:-.15,ry:Math.PI*2,rz:.05,z:2.75,scale:1.2},
]

const lerp=(a,b,t)=>a+(b-a)*t

const smooth=(a,b,t)=>{
 let x=Math.max(0,Math.min(1,(t-a)/(b-a)))
 return x*x*(3-2*x)
}

let target=0
let current=0

window.addEventListener("message",(e)=>{
 if(e.data.type==="scroll"){
  target=e.data.progress
 }
})

window.addEventListener("scroll",()=>{
 const h=document.documentElement.scrollHeight-window.innerHeight
 target=h>0?window.scrollY/h:0
})

function animate(){

 requestAnimationFrame(animate)

 current += (target-current)*.06

 if(model){

   let p1=poses[0]
   let p2=poses[1]
   let t=0

   for(let i=0;i<poses.length;i++){

      if(current>=poses[i].s && current<=poses[i].e){
          p1=poses[i]
          p2=poses[Math.min(i+1,poses.length-1)]
          t=smooth(p1.s,p1.e,current)
          break
      }

   }

   model.position.x = lerp(p1.x,p2.x,t)
   model.position.y = lerp(p1.y,p2.y,t)

   model.rotation.x = lerp(p1.rx,p2.rx,t)

   model.rotation.y =
      lerp(p1.ry,p2.ry,t)
      + Math.sin(Date.now()*0.0003)*0.05

   model.rotation.z = lerp(p1.rz,p2.rz,t)

   const s=lerp(p1.scale,p2.scale,t)
   model.scale.setScalar(s)

   camera.position.z = lerp(p1.z,p2.z,t)
 }

 renderer.render(scene,camera)
}

animate()

window.addEventListener("resize",()=>{

 camera.aspect=window.innerWidth/window.innerHeight
 camera.updateProjectionMatrix()
 renderer.setSize(window.innerWidth,window.innerHeight)

})
