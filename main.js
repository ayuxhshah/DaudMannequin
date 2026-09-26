import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("heroCanvas"),
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0xffffff,0);

// Scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth/window.innerHeight,
  0.1,
  100
);

camera.position.set(0,0.3,8);

// Lights
scene.add(new THREE.AmbientLight(0xffffff,1));

const key = new THREE.DirectionalLight(0xffffff,2.5);
key.position.set(5,5,5);
scene.add(key);

const rim = new THREE.DirectionalLight(0xff8ad8,1.2);
rim.position.set(-5,3,-5);
scene.add(rim);

// Hero Group
const heroRig = new THREE.Group();
scene.add(heroRig);

let hero;
let scrollTarget = 0;
let scroll = 0;

new GLTFLoader().load("./DaudHero.glb",(gltf)=>{
    hero = gltf.scene;

    hero.scale.setScalar(0.031);
    hero.position.set(0,-2.35,0);
    hero.rotation.y = Math.PI;

    heroRig.add(hero);
});

// FRAMER SCROLL ONLY
window.addEventListener("message",(event)=>{
    if(event.data?.type==="scroll"){
        scrollTarget = THREE.MathUtils.clamp(event.data.progress,0,1);
    }
});

const clock = new THREE.Clock();

function animate(){
    requestAnimationFrame(animate);

    scroll += (scrollTarget-scroll)*0.08;

    if(hero){

        heroRig.rotation.y = scroll * Math.PI * 2;
        heroRig.rotation.x = Math.sin(scroll*Math.PI)*0.15;
        heroRig.rotation.z = Math.sin(scroll*Math.PI*2)*0.05;

        heroRig.position.y = Math.sin(clock.getElapsedTime()*1.3)*0.02;

        camera.lookAt(0,-0.15,0);
    }

    renderer.render(scene,camera);
}

animate();

window.addEventListener("resize",()=>{
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
});
