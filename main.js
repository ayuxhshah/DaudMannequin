import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// =====================================================
// SETTINGS
// =====================================================

const MODEL_SCALE = 0.031;

const MODEL_POSITION = new THREE.Vector3(
  0,
  -2.35,
  0
);

const CAMERA_FOCAL_LENGTH = 35;
const CAMERA_FILM_GAUGE = 36;

// =====================================================
// HERO FRAMING
// =====================================================
//
// Current mathematically-correct camera is:
//
// X = 9.02751
// Y = 0.089979
// Z = -0.0718363
//
// The Blender screenshot has considerably more
// breathing room around the mannequin.
//
// We therefore pull the camera back along its
// viewing axis.
//

const HERO_CAMERA_DISTANCE_MULTIPLIER = 1.55;

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
// MIRROR HERO VIEW
// =====================================================
//
// The current mathematically reconstructed camera
// produces the correct 3D orientation, but the
// resulting screen composition is horizontally
// opposite to the Blender camera screenshot.
//
// Mirror the final render horizontally.
//
// This does NOT rotate or modify the mannequin.
//

canvas.style.transform =
  "scaleX(-1)";

// =====================================================
// SCENE
// =====================================================

const scene =
  new THREE.Scene();

// =====================================================
// CAMERA
// =====================================================

const camera =
  new THREE.PerspectiveCamera(
    40,
    window.innerWidth /
      window.innerHeight,
    0.01,
    1000
  );

camera.filmGauge =
  CAMERA_FILM_GAUGE;

camera.setFocalLength(
  CAMERA_FOCAL_LENGTH
);

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
// MANNEQUIN
// =====================================================

const heroRig =
  new THREE.Group();

scene.add(heroRig);

let hero = null;

new GLTFLoader().load(
  "./DaudHero.glb",

  (gltf) => {
    hero = gltf.scene;

    // ---------------------------------------------------
    // DO NOT ROTATE THE MODEL.
    // DO NOT CHANGE ITS ORIENTATION.
    // ---------------------------------------------------

    hero.scale.setScalar(
      MODEL_SCALE
    );

    hero.position.copy(
      MODEL_POSITION
    );

    heroRig.add(hero);
  },

  undefined,

  (error) => {
    console.error(
      "Failed to load DaudHero.glb:",
      error
    );
  }
);

// =====================================================
// SCROLL FROM FRAMER
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
// CAMERA 1 — HERO
// =====================================================
//
// Source of truth:
//
// Blender:
//
// Location
// X = 291.21
// Y = 2.3173
// Z = 78.709
//
// Rotation
// X = 90°
// Y = 90°
// Z = 90°
//
// Lens
// 35mm
//
// Converted Three.js camera:
//
// Position
// X = 9.02751
// Y = 0.089979
// Z = -0.0718363
//
// Quaternion
// X = 0.5
// Y = 0.5
// Z = 0.5
// W = 0.5
//
// =====================================================

const heroCameraPosition =
  new THREE.Vector3(
    9.02751,
    0.089979,
    -0.0718363
  );

// Pull the camera farther away from the mannequin.
//
// We scale around the mannequin's approximate
// scene center rather than simply changing the
// focal length, preserving the 35mm perspective.

const heroCameraCenter =
  new THREE.Vector3(
    0,
    -2.35,
    0
  );

heroCameraPosition
  .sub(heroCameraCenter)
  .multiplyScalar(
    HERO_CAMERA_DISTANCE_MULTIPLIER
  )
  .add(heroCameraCenter);

const heroCameraQuaternion =
  new THREE.Quaternion(
    0.5,
    0.5,
    0.5,
    0.5
  );

// =====================================================
// CAMERA STATES
// =====================================================

const cameraStates = [

  // ===================================================
  // 01 — HERO
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },

  // ===================================================
  // 02 — SERVICE
  // PLACEHOLDER FOR NOW
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },

  // ===================================================
  // 03 — ABOUT
  // PLACEHOLDER FOR NOW
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },

  // ===================================================
  // 04 — PROJECT
  // PLACEHOLDER FOR NOW
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },

  // ===================================================
  // 05 — TESTIMONIALS
  // PLACEHOLDER FOR NOW
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },

  // ===================================================
  // 06 — FAQ
  // PLACEHOLDER FOR NOW
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },

  // ===================================================
  // 07 — CONTACT
  // SAME AS HERO
  // ===================================================

  {
    position:
      heroCameraPosition.clone(),

    quaternion:
      heroCameraQuaternion.clone(),
  },
];

// =====================================================
// CAMERA ANIMATION
// =====================================================

const currentPosition =
  new THREE.Vector3();

const currentQuaternion =
  new THREE.Quaternion();

function ease(t) {
  return (
    t *
    t *
    (3 - 2 * t)
  );
}

// =====================================================
// FLOAT
// =====================================================

const clock =
  new THREE.Clock();

// =====================================================
// ANIMATION
// =====================================================

function animate() {
  requestAnimationFrame(
    animate
  );

  scroll +=
    (
      scrollTarget -
      scroll
    ) *
    0.08;

  const maxIndex =
    cameraStates.length - 1;

  const exact =
    THREE.MathUtils.clamp(
      scroll,
      0,
      maxIndex
    );

  const index =
    Math.min(
      Math.floor(exact),
      maxIndex
    );

  const next =
    Math.min(
      index + 1,
      maxIndex
    );

  const rawLocal =
    exact - index;

  const local =
    ease(rawLocal);

  const currentCamera =
    cameraStates[index];

  const nextCamera =
    cameraStates[next];

  // ---------------------------------------------------
  // CAMERA POSITION
  // ---------------------------------------------------

  currentPosition.lerpVectors(
    currentCamera.position,
    nextCamera.position,
    local
  );

  camera.position.copy(
    currentPosition
  );

  // ---------------------------------------------------
  // CAMERA ROTATION
  // ---------------------------------------------------

  currentQuaternion.slerpQuaternions(
    currentCamera.quaternion,
    nextCamera.quaternion,
    local
  );

  camera.quaternion.copy(
    currentQuaternion
  );

  // ---------------------------------------------------
  // SUBTLE MODEL FLOAT
  // ---------------------------------------------------

  if (hero) {
    heroRig.position.y =
      Math.sin(
        clock.getElapsedTime() *
          1.3
      ) *
      0.02;
  }

  renderer.render(
    scene,
    camera
  );
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

    camera.aspect =
      width / height;

    camera.updateProjectionMatrix();
  }
);
