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

// Blender camera:
// 35mm lens
// Default Blender sensor width = 36mm
const CAMERA_FOCAL_LENGTH = 35;
const CAMERA_FILM_GAUGE = 36;

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

// Match Blender's default camera sensor.
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
    // DO NOT ROTATE THE MANNEQUIN
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
// CAMERA STATES
// =====================================================
//
// CAMERA 1 IS NOW CALCULATED FROM:
//
// Blender Camera:
//
// Location:
// X = 291.21
// Y = 2.3173
// Z = 78.709
//
// Rotation:
// X = 90°
// Y = 90°
// Z = 90°
//
// Lens:
// 35mm
//
// GLB root + existing model scale:
// 0.031
//
// Resulting Three.js world transform:
//
// Position:
// X = 9.02751
// Y = 0.089979
// Z = -0.0718363
//
// Quaternion:
// X = 0.5
// Y = 0.5
// Z = 0.5
// W = 0.5
//
// =====================================================

const cameraStates = [

  // ===================================================
  // 01 — HERO
  // EXACT BLENDER CAMERA
  // ===================================================

  {
    position:
      new THREE.Vector3(
        9.02751,
        0.089979,
        -0.0718363
      ),

    quaternion:
      new THREE.Quaternion(
        0.5,
        0.5,
        0.5,
        0.5
      ),
  },

  // ===================================================
  // 02 — SERVICE
  // TEMPORARY — OLD CONVERSION
  // ===================================================

  {
    position:
      new THREE.Vector3(
        -5.621,
        -0.2856,
        6.893
      ),

    quaternion:
      new THREE.Quaternion(
        0,
        0,
        0,
        1
      ),
  },

  // ===================================================
  // 03 — ABOUT
  // TEMPORARY
  // ===================================================

  {
    position:
      new THREE.Vector3(
        3.801,
        4.978,
        -2.245
      ),

    quaternion:
      new THREE.Quaternion(
        0,
        0,
        0,
        1
      ),
  },

  // ===================================================
  // 04 — PROJECT
  // TEMPORARY
  // ===================================================

  {
    position:
      new THREE.Vector3(
        -2.038,
        0.556,
        1.641
      ),

    quaternion:
      new THREE.Quaternion(
        0,
        0,
        0,
        1
      ),
  },

  // ===================================================
  // 05 — TESTIMONIALS
  // TEMPORARY
  // ===================================================

  {
    position:
      new THREE.Vector3(
        5.200,
        1.098,
        -5.051
      ),

    quaternion:
      new THREE.Quaternion(
        0,
        0,
        0,
        1
      ),
  },

  // ===================================================
  // 06 — FAQ
  // TEMPORARY
  // ===================================================

  {
    position:
      new THREE.Vector3(
        -1.233,
        1.381,
        1.956
      ),

    quaternion:
      new THREE.Quaternion(
        0,
        0,
        0,
        1
      ),
  },

  // ===================================================
  // 07 — CONTACT
  // SAME AS HERO
  // ===================================================

  {
    position:
      new THREE.Vector3(
        9.02751,
        0.089979,
        -0.0718363
      ),

    quaternion:
      new THREE.Quaternion(
        0.5,
        0.5,
        0.5,
        0.5
      ),
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

  // Smooth scroll
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
  // POSITION
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
  // ROTATION
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
