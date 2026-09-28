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

const MODEL_ROTATION = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, Math.PI, 0)
);

// Blender camera
const BLENDER_LENS = 35;
const BLENDER_SENSOR_X = 36;
const BLENDER_SENSOR_Y = 24;

// =====================================================
// RENDERER
// =====================================================

const canvas = document.getElementById("heroCanvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1;

// =====================================================
// SCENE
// =====================================================

const scene = new THREE.Scene();

// =====================================================
// CAMERA
// =====================================================

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
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

const key = new THREE.DirectionalLight(
  0xffffff,
  2.5
);

key.position.set(
  5,
  5,
  5
);

scene.add(key);

const rim = new THREE.DirectionalLight(
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
// HERO MODEL
// =====================================================

const heroRig = new THREE.Group();

scene.add(heroRig);

let hero = null;

new GLTFLoader().load(
  "./DaudHero.glb",
  (gltf) => {
    hero = gltf.scene;

    hero.scale.setScalar(
      MODEL_SCALE
    );

    hero.position.copy(
      MODEL_POSITION
    );

    hero.rotation.y =
      Math.PI;

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
// SCROLL
// =====================================================
//
// Framer sends:
//
// 0 = Camera 1
// 1 = Camera 2
// 2 = Camera 3
// 3 = Camera 4
// 4 = Camera 5
// 5 = Camera 6
// 6 = Camera 7
//
// Therefore:
//
// 0vh   → Camera 1
// 100vh → Camera 2
// 200vh → Camera 3
// 300vh → Camera 4
// 400vh → Camera 5
// 500vh → Camera 6
// 600vh → Camera 7
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
// Three/glTF:
// X = X
// Y = up
// Z = depth
//
// Therefore:
//
// Three X = Blender X
// Three Y = Blender Z
// Three Z = -Blender Y
// =====================================================

function blenderPositionToThree(
  x,
  y,
  z
) {
  const position =
    new THREE.Vector3(
      x,
      z,
      -y
    );

  // Apply the exact same transform
  // that we apply to the GLB model.
  position.multiplyScalar(
    MODEL_SCALE
  );

  position.applyQuaternion(
    MODEL_ROTATION
  );

  position.add(
    MODEL_POSITION
  );

  return position;
}

// =====================================================
// BLENDER DIRECTION → THREE DIRECTION
// =====================================================

function blenderDirectionToThree(
  direction
) {
  return new THREE.Vector3(
    direction.x,
    direction.z,
    -direction.y
  );
}

// =====================================================
// CREATE CAMERA FROM BLENDER TRANSFORM
// =====================================================
//
// This is the important part.
//
// We DO NOT try to directly convert the Euler
// rotation into a Three.js Euler rotation.
//
// Instead:
//
// 1. Build the Blender camera rotation.
// 2. Get its actual forward direction.
// 3. Get its actual up direction.
// 4. Convert those directions into glTF/Three space.
// 5. Apply the exact model transform.
// 6. Build a Three.js camera quaternion.
//
// This preserves the actual Blender camera composition.
// =====================================================

function createBlenderCamera(
  x,
  y,
  z,
  rotationX,
  rotationY,
  rotationZ
) {
  // ---------------------------------------------------
  // POSITION
  // ---------------------------------------------------

  const position =
    blenderPositionToThree(
      x,
      y,
      z
    );

  // ---------------------------------------------------
  // BLENDER ROTATION
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
  // BLENDER CAMERA FORWARD
  // ---------------------------------------------------
  //
  // Blender cameras look down local -Z.
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
  // BLENDER CAMERA UP
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
  // CONVERT WORLD DIRECTIONS
  // ---------------------------------------------------

  const forward =
    blenderDirectionToThree(
      blenderForward
    );

  const up =
    blenderDirectionToThree(
      blenderUp
    );

  // ---------------------------------------------------
  // APPLY MODEL ROTATION
  // ---------------------------------------------------
  //
  // The GLB itself is rotated by Math.PI in the
  // existing site, so the camera needs the same
  // rotation to preserve the Blender composition.
  // ---------------------------------------------------

  forward.applyQuaternion(
    MODEL_ROTATION
  );

  up.applyQuaternion(
    MODEL_ROTATION
  );

  forward.normalize();
  up.normalize();

  // ---------------------------------------------------
  // BUILD CAMERA BASIS
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

  // Three.js camera local +Z points backward.
  //
  // Therefore local +Z = -forward.
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

  return {
    position,
    quaternion,
  };
}

// =====================================================
// THE 7 BLENDER CAMERA STATES
// =====================================================
//
// These values come directly from the camera
// transforms you gave me.
//
// All cameras use:
// Focal Length = 35mm
// =====================================================

const cameraStates = [

  // ===================================================
  // 01 — HERO
  // ===================================================

  createBlenderCamera(
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

  createBlenderCamera(
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

  createBlenderCamera(
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

  createBlenderCamera(
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

  createBlenderCamera(
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

  createBlenderCamera(
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
  //
  // Same camera transform as Camera 1.
  // ===================================================

  createBlenderCamera(
    -133.14,
    -298.75,
    220.86,

    66.96,
    -0.000309,
    -25.2
  ),
];

// =====================================================
// CAMERA FOV
// =====================================================
//
// Blender camera:
//
// Lens = 35mm
// Sensor X = 36mm
// Sensor Y = 24mm
// Sensor Fit = Auto
//
// We reproduce that projection in Three.js.
// =====================================================

function updateCameraProjection() {
  const width =
    window.innerWidth;

  const height =
    window.innerHeight;

  const aspect =
    width / height;

  camera.aspect =
    aspect;

  let verticalFOV;

  const sensorAspect =
    BLENDER_SENSOR_X /
    BLENDER_SENSOR_Y;

  if (
    aspect >= sensorAspect
  ) {
    // Landscape / horizontal sensor fit

    verticalFOV =
      2 *
      Math.atan(
        (
          BLENDER_SENSOR_X /
          aspect
        ) /
          (
            2 *
            BLENDER_LENS
          )
      );
  } else {
    // Portrait / vertical sensor fit

    verticalFOV =
      2 *
      Math.atan(
        BLENDER_SENSOR_Y /
          (
            2 *
            BLENDER_LENS
          )
      );
  }

  camera.fov =
    THREE.MathUtils.radToDeg(
      verticalFOV
    );

  camera.near = 0.1;
  camera.far = 1000;

  camera.updateProjectionMatrix();
}

updateCameraProjection();

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
// FLOATING MODEL
// =====================================================

const clock =
  new THREE.Clock();

// =====================================================
// ANIMATION LOOP
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
  // LOCAL CAMERA TRANSITION
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
    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    updateCameraProjection();
  }
);
