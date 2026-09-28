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
  new THREE.Euler(
    0,
    Math.PI,
    0
  )
);

// This is the Armature origin from the Blender/GLB scene.
// The mannequin is NOT located at Blender world origin.
const BLENDER_MODEL_ORIGIN =
  new THREE.Vector3(
    -4.3,
    119.581619,
    36.920780
  );

// Blender camera lens
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

// Use the actual Blender 35mm focal length.
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
// HERO MODEL
// =====================================================

const heroRig =
  new THREE.Group();

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
//
// Blender:
//
// X = X
// Y = depth
// Z = up
//
// Three:
//
// X = X
// Y = up
// Z = depth
//
// So:
// X → X
// Y → -Z
// Z → Y
//
// IMPORTANT:
// We first subtract the mannequin's actual
// Armature origin.
//
// This is the piece we were missing.
// =====================================================

function blenderCameraPositionToThree(
  x,
  y,
  z
) {
  // Camera position in Blender world space
  const cameraWorld =
    new THREE.Vector3(
      x,
      y,
      z
    );

  // -----------------------------------------------
  // CAMERA RELATIVE TO MANNEQUIN
  // -----------------------------------------------

  cameraWorld.sub(
    BLENDER_MODEL_ORIGIN
  );

  // -----------------------------------------------
  // BLENDER → GLTF AXIS CONVERSION
  // -----------------------------------------------

  const converted =
    new THREE.Vector3(
      cameraWorld.x,
      cameraWorld.z,
      -cameraWorld.y
    );

  // -----------------------------------------------
  // SAME SCALE AS THE MODEL
  // -----------------------------------------------

  converted.multiplyScalar(
    MODEL_SCALE
  );

  // -----------------------------------------------
  // SAME ROTATION AS THE MODEL
  // -----------------------------------------------

  converted.applyQuaternion(
    MODEL_ROTATION
  );

  // -----------------------------------------------
  // SAME POSITION AS THE MODEL
  // -----------------------------------------------

  converted.add(
    MODEL_POSITION
  );

  return converted;
}

// =====================================================
// BLENDER CAMERA ROTATION → THREE
// =====================================================

function blenderCameraRotationToThree(
  rotationX,
  rotationY,
  rotationZ
) {
  // -----------------------------------------------
  // ORIGINAL BLENDER CAMERA ROTATION
  // -----------------------------------------------

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

  // -----------------------------------------------
  // GET CAMERA BASIS IN BLENDER
  // -----------------------------------------------

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

  // -----------------------------------------------
  // BLENDER → THREE AXIS CONVERSION
  // -----------------------------------------------

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

  // -----------------------------------------------
  // SAME MODEL ROTATION
  // -----------------------------------------------

  forward.applyQuaternion(
    MODEL_ROTATION
  );

  up.applyQuaternion(
    MODEL_ROTATION
  );

  forward.normalize();
  up.normalize();

  // -----------------------------------------------
  // BUILD THREE CAMERA BASIS
  // -----------------------------------------------

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

  // Three camera looks down -Z.
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
// CAMERA CREATOR
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
      blenderCameraPositionToThree(
        x,
        y,
        z
      ),

    quaternion:
      blenderCameraRotationToThree(
        rotationX,
        rotationY,
        rotationZ
      ),
  };
}

// =====================================================
// 7 BLENDER CAMERAS
// =====================================================

const cameraStates = [

  // ---------------------------------------------------
  // 01 — HERO
  // ---------------------------------------------------

  createCameraState(
    -133.14,
    -298.75,
    220.86,

    66.96,
    -0.000309,
    -25.2
  ),

  // ---------------------------------------------------
  // 02 — SERVICE
  // ---------------------------------------------------

  createCameraState(
    -181.3,
    -222.34,
    -9.2144,

    106.64,
    -0.000018,
    -30.96
  ),

  // ---------------------------------------------------
  // 03 — ABOUT
  // ---------------------------------------------------

  createCameraState(
    122.61,
    72.408,
    160.58,

    70.48,
    -0.000171,
    114.64
  ),

  // ---------------------------------------------------
  // 04 — PROJECT
  // ---------------------------------------------------

  createCameraState(
    -65.746,
    -52.944,
    17.939,

    149.2,
    -0.00006,
    -35.76
  ),

  // ---------------------------------------------------
  // 05 — TESTIMONIALS
  // ---------------------------------------------------

  createCameraState(
    167.75,
    162.91,
    35.415,

    97.36,
    -0.00028,
    115.92
  ),

  // ---------------------------------------------------
  // 06 — FAQ
  // ---------------------------------------------------

  createCameraState(
    -39.796,
    -63.091,
    44.541,

    141.52,
    -0.000219,
    -37.36
  ),

  // ---------------------------------------------------
  // 07 — CONTACT
  // ---------------------------------------------------

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
  // TRANSITION PROGRESS
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
