import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// =====================================================
// RENDERER
// =====================================================

const canvas =
  document.getElementById("heroCanvas");

const renderer =
  new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1;

// =====================================================
// SCENE
// =====================================================

const scene =
  new THREE.Scene();

// =====================================================
// ACTIVE CAMERA
// =====================================================
//
// IMPORTANT:
//
// We do NOT create a new PerspectiveCamera.
//
// Blender's actual camera is inside the GLB.
//
// GLTFLoader will reconstruct its exact:
// - position
// - rotation
// - projection
// - near/far
//
// =====================================================

let camera = null;

// =====================================================
// LIGHTS
// =====================================================

scene.add(
  new THREE.AmbientLight(
    0xffffff,
    1
  )
);

const key =
  new THREE.DirectionalLight(
    0xffffff,
    2.5
  );

key.position.set(
  5,
  5,
  5
);

scene.add(key);

const rim =
  new THREE.DirectionalLight(
    0xff8ad8,
    1.2
  );

rim.position.set(
  -5,
  3,
  -5
);

scene.add(rim);

// =====================================================
// LOAD BLENDER GLB
// =====================================================

const loader =
  new GLTFLoader();

loader.load(
  "./DaudHeroWithCamera.glb",

  (gltf) => {

    console.log(
      "GLB loaded:",
      gltf
    );

    // -------------------------------------------------
    // ADD THE ENTIRE BLENDER SCENE
    // -------------------------------------------------
    //
    // DO NOT scale it.
    //
    // DO NOT move it.
    //
    // DO NOT rotate it.
    //
    // The mannequin and camera were exported from
    // the same Blender coordinate system.
    //

    scene.add(
      gltf.scene
    );

    // -------------------------------------------------
    // GET BLENDER CAMERA
    // -------------------------------------------------

    if (
      gltf.cameras &&
      gltf.cameras.length > 0
    ) {

      camera =
        gltf.cameras[0];

      console.log(
        "Using Blender camera:",
        camera
      );

      console.log(
        "Camera position:",
        camera.position
      );

      console.log(
        "Camera quaternion:",
        camera.quaternion
      );

      console.log(
        "Camera FOV:",
        camera.fov
      );

      // -------------------------------------------------
      // ADD CAMERA TO THE THREE SCENE
      // -------------------------------------------------

      scene.add(
        camera
      );

      // -------------------------------------------------
      // MATCH CURRENT VIEWPORT
      // -------------------------------------------------

      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

    } else {

      console.error(
        "NO CAMERA FOUND IN GLB"
      );

    }

  },

  (progress) => {

    if (
      progress.total > 0
    ) {

      console.log(
        "Loading:",
        (
          progress.loaded /
          progress.total *
          100
        ).toFixed(1) + "%"
      );

    }

  },

  (error) => {

    console.error(
      "Failed to load DaudHeroWithCamera.glb:",
      error
    );

  }
);

// =====================================================
// SCROLL FROM FRAMER
// =====================================================
//
// We are keeping your existing scroll bridge alive.
//
// For this first test, Camera 1 is the Blender camera.
// We will add the other six cameras after this works.
//
// =====================================================

let scrollTarget = 0;

let scroll = 0;

window.addEventListener(
  "message",
  (event) => {

    if (
      event.data?.type !== "scroll"
    ) {
      return;
    }

    scrollTarget =
      THREE.MathUtils.clamp(
        event.data.progress,
        0,
        6
      );

  }
);

// =====================================================
// ANIMATION
// =====================================================

const clock =
  new THREE.Clock();

function animate() {

  requestAnimationFrame(
    animate
  );

  // ---------------------------------------------------
  // SMOOTH SCROLL
  // ---------------------------------------------------

  scroll +=
    (
      scrollTarget -
      scroll
    ) *
    0.08;

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  if (camera) {

    renderer.render(
      scene,
      camera
    );

  }

}

animate();

// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
  "resize",
  () => {

    const width =
      window.innerWidth;

    const height =
      window.innerHeight;

    renderer.setSize(
      width,
      height
    );

    if (camera) {

      camera.aspect =
        width / height;

      camera.updateProjectionMatrix();

    }

  }
);
