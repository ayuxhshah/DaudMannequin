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
// HERO CAMERA CORRECTION
// =====================================================
//
// TEMPORARY CORRECTION FOR CAMERA 1.
//
// We are deliberately NOT touching the mannequin.
//
// The current Blender-derived camera is close to the
// correct composition, but is viewing from the wrong
// side.
//
// Move camera toward its RIGHT by this amount.
const HERO_CAMERA_RIGHT_OFFSET = 4.0;

// Rotate camera around world Y.
const HERO_CAMERA_YAW =
  THREE.MathUtils.degToRad(90);

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
    // MANNEQUIN IS FIXED.
    //
    // NO ROTATION.
    // NO SCROLL ROTATION.
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
// BLENDER → THREE POSITION
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

  // Blender camera looks down -Z.
  const blenderForward =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  blenderForward.applyQuaternion(
    blenderQuaternion
  );

  // Blender camera up is +Y.
  const blenderUp =
    new THREE.Vector3(
      0,
      1,
      0
    );

  blenderUp.applyQuaternion(
    blenderQuaternion
  );

  // Blender → Three axis conversion.
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

  // Camera right vector.
  const right =
    new THREE.Vector3();

  right.crossVectors(
    forward,
    up
  );

  right.normalize();

  // Corrected up vector.
  const correctedUp =
    new THREE.Vector3();

  correctedUp.crossVectors(
    right,
    forward
  );

  correctedUp.normalize();

  // Three.js camera looks down -Z.
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
// CAMERA STATES
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
// APPLY HERO CAMERA CORRECTION
// =====================================================
//
// IMPORTANT:
//
// We correct the CAMERA, not the mannequin.
//
// 1. Move camera toward its local right.
// 2. Rotate camera +90° around WORLD Y.
// =====================================================

function correctHeroCamera(
  state
) {
  // ---------------------------------------------------
  // MOVE CAMERA TOWARD ITS RIGHT
  // ---------------------------------------------------

  const forward =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  forward.applyQuaternion(
    state.quaternion
  );

  const up =
    new THREE.Vector3(
      0,
      1,
      0
    );

  up.applyQuaternion(
    state.quaternion
  );

  const right =
    new THREE.Vector3();

  right.crossVectors(
    forward,
    up
  );

  right.normalize();

  state.position.add(
    right.multiplyScalar(
      HERO_CAMERA_RIGHT_OFFSET
    )
  );

  // ---------------------------------------------------
  // ROTATE CAMERA +90° AROUND WORLD Y
  // ---------------------------------------------------

  const yaw =
    new THREE.Quaternion();

  yaw.setFromAxisAngle(
    new THREE.Vector3(
      0,
      1,
      0
    ),
    HERO_CAMERA_YAW
  );

  state.quaternion =
    yaw
      .clone()
      .multiply(
        state.quaternion
      );
}

// Apply correction ONLY to Camera 1.
correctHeroCamera(
  cameraStates[0]
);

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
  // TRANSITION
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
