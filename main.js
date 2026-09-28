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
    // IMPORTANT:
    //
    // DO NOT ROTATE THE GLB.
    //
    // The exported GLB already has the Blender
    // mannequin orientation.
    // ---------------------------------------------------

    hero.scale.setScalar(
      MODEL_SCALE
    );

    hero.position.copy(
      MODEL_POSITION
    );

    // NO hero.rotation.y = Math.PI

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
//
// 0 = Camera 1
// 1 = Camera 2
// 2 = Camera 3
// 3 = Camera 4
// 4 = Camera 5
// 5 = Camera 6
// 6 = Camera 7
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
// BLENDER → THREE POSITION
// =====================================================
//
// Blender:
// X = X
// Y = depth
// Z = up
//
// Three / glTF:
// X = X
// Y = up
// Z = depth
//
// Conversion:
//
// X → X
// Y → -Z
// Z → Y
// =====================================================

function blenderPositionToThree(
  x,
  y,
  z
) {
  return new THREE.Vector3(
    x * MODEL_SCALE,
    z * MODEL_SCALE,
    -y * MODEL_SCALE
  );
}

// =====================================================
// BLENDER CAMERA ROTATION → THREE
// =====================================================

function blenderRotationToThree(
  rotationX,
  rotationY,
  rotationZ
) {
  // ---------------------------------------------------
  // Blender camera rotation
  // ---------------------------------------------------

  const blenderEuler =
    new THREE.Euler(
      THREE.MathUtils.degToRad(
        rotationX
      ),
      THREE.MathUtils.degToRad(
        rotationY
      ),
      THREE.MathUtils.degToRad(
        rotationZ
      ),
      "XYZ"
    );

  const blenderQuaternion =
    new THREE.Quaternion();

  blenderQuaternion.setFromEuler(
    blenderEuler
  );

  // ---------------------------------------------------
  // Blender camera forward
  // ---------------------------------------------------
  //
  // Blender cameras look down -Z.
  // ---------------------------------------------------

  const blenderForward =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  blenderForward.applyQuaternion(
    blenderQuaternion
  );

  // ---------------------------------------------------
  // Blender camera up
  // ---------------------------------------------------

  const blenderUp =
    new THREE.Vector3(
      0,
      1,
      0
    );

  blenderUp.applyQuaternion(
    blenderQuaternion
  );

  // ---------------------------------------------------
  // AXIS CONVERSION ONLY
  //
  // NO MANNEQUIN ROTATION.
  // ---------------------------------------------------

  const forward =
    new THREE.Vector3(
      blenderForward.x,
      blenderForward.z,
      -blenderForward.y
    );

  const up =
    new THREE.Vector3(
      blenderUp.x,
      blenderUp.z,
      -blenderUp.y
    );

  forward.normalize();
  up.normalize();

  // ---------------------------------------------------
  // CAMERA BASIS
  // ---------------------------------------------------

  const right =
    new THREE.Vector3();

  right.crossVectors(
    forward,
    up
  );

  right.normalize();

  const correctedUp =
    new THREE.Vector3();

  correctedUp.crossVectors(
    right,
    forward
  );

  correctedUp.normalize();

  // ---------------------------------------------------
  // THREE CAMERA LOOKS DOWN -Z
  // ---------------------------------------------------

  const backward =
    forward
      .clone()
      .negate();

  const rotationMatrix =
    new THREE.Matrix4();

  rotationMatrix.makeBasis(
    right,
    correctedUp,
    backward
  );

  const quaternion =
    new THREE.Quaternion();

  quaternion.setFromRotationMatrix(
    rotationMatrix
  );

  return quaternion;
}

// =====================================================
// CAMERA STATE
// =====================================================

function createCameraState(
  x,
  y,
  z,
  rotationX,
  rotationY,
  rotationZ
) {
  return {
    position:
      blenderPositionToThree(
        x,
        y,
        z
      ),

    quaternion:
      blenderRotationToThree(
        rotationX,
        rotationY,
        rotationZ
      ),
  };
}

// =====================================================
// THE 7 BLENDER CAMERAS
// =====================================================

const cameraStates = [

  // ===================================================
  // 01 — HERO
  // ===================================================

  createCameraState(
    -133.14,
    -298.75,
    220.86,

    66.96,
    -0.000309,
    -25.2
  ),

  // ===================================================
  // 02 — SERVICE
  // ===================================================

  createCameraState(
    -181.3,
    -222.34,
    -9.2144,

    106.64,
    -0.000018,
    -30.96
  ),

  // ===================================================
  // 03 — ABOUT
  // ===================================================

  createCameraState(
    122.61,
    72.408,
    160.58,

    70.48,
    -0.000171,
    114.64
  ),

  // ===================================================
  // 04 — PROJECT
  // ===================================================

  createCameraState(
    -65.746,
    -52.944,
    17.939,

    149.2,
    -0.00006,
    -35.76
  ),

  // ===================================================
  // 05 — TESTIMONIALS
  // ===================================================

  createCameraState(
    167.75,
    162.91,
    35.415,

    97.36,
    -0.00028,
    115.92
  ),

  // ===================================================
  // 06 — FAQ
  // ===================================================

  createCameraState(
    -39.796,
    -63.091,
    44.541,

    141.52,
    -0.000219,
    -37.36
  ),

  // ===================================================
  // 07 — CONTACT
  // ===================================================

  createCameraState(
    -133.14,
    -298.75,
    220.86,

    66.96,
    -0.000309,
    -25.2
  ),
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
// MANNEQUIN FLOAT
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
  // CAMERA INDEX
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // LOCAL TRANSITION
  // ---------------------------------------------------

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
  // MANNEQUIN FLOAT
  // ---------------------------------------------------

  if (hero) {
    heroRig.position.y =
      Math.sin(
        clock.getElapsedTime() *
          1.3
      ) *
      0.02;
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

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
