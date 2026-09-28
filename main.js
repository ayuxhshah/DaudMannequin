import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// =====================================================
// CONFIG
// =====================================================

const GLB_FILE =
  "./DaudHeroWithCameras.glb";

const CAMERA_COUNT = 7;

// How smoothly the camera follows Framer scroll.
// Lower = smoother/slower.
// Higher = faster/snappier.
const CAMERA_SMOOTHING = 0.08;

// =====================================================
// CANVAS
// =====================================================

const canvas =
  document.getElementById("heroCanvas");

// =====================================================
// RENDERER
// =====================================================

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
// RENDER CAMERA
// =====================================================
//
// IMPORTANT:
//
// This is NOT one of the Blender cameras.
//
// The Blender cameras are used as source states.
//
// This camera is the camera that Three.js actually
// renders through.
//
// Its transform is continuously interpolated between
// the seven Blender cameras.
//

const renderCamera =
  new THREE.PerspectiveCamera(
    40,
    window.innerWidth /
      window.innerHeight,
    0.01,
    10000
  );

scene.add(
  renderCamera
);

// =====================================================
// LIGHTS
// =====================================================
//
// Keep these because the GLB may not contain the exact
// lighting from Blender's viewport/render setup.
//
// =====================================================

const ambient =
  new THREE.AmbientLight(
    0xffffff,
    1
  );

scene.add(
  ambient
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

scene.add(
  key
);

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

scene.add(
  rim
);

// =====================================================
// SCROLL STATE
// =====================================================

let scrollTarget = 0;

let scroll = 0;

// =====================================================
// RECEIVE SCROLL FROM FRAMER
// =====================================================

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
        Number(
          event.data.progress
        ) || 0,
        0,
        CAMERA_COUNT - 1
      );

  }
);

// =====================================================
// CAMERA STATES
// =====================================================

const cameraStates = [];

// =====================================================
// TEMPORARY OBJECTS USED DURING EXTRACTION
// =====================================================

const tempPosition =
  new THREE.Vector3();

const tempQuaternion =
  new THREE.Quaternion();

// =====================================================
// LOAD GLB
// =====================================================

const loader =
  new GLTFLoader();

loader.load(

  GLB_FILE,

  (gltf) => {

    console.log(
      "===================================="
    );

    console.log(
      "DaudHeroWithCameras.glb loaded."
    );

    console.log(
      "===================================="
    );

    // -------------------------------------------------
    // ADD THE ENTIRE BLENDER SCENE
    // -------------------------------------------------
    //
    // THIS IS CRITICAL.
    //
    // We do NOT scale it.
    // We do NOT rotate it.
    // We do NOT reposition it.
    //
    // The mannequin and cameras stay exactly as
    // Blender exported them.
    //

    scene.add(
      gltf.scene
    );

    // -------------------------------------------------
    // UPDATE WORLD MATRICES
    // -------------------------------------------------
    //
    // We need the final world-space transform of each
    // Blender camera.
    //

    gltf.scene.updateMatrixWorld(
      true
    );

    // -------------------------------------------------
    // FIND THE 7 CAMERAS
    // -------------------------------------------------

    let blenderCameras = [];

    if (
      gltf.cameras &&
      gltf.cameras.length > 0
    ) {

      blenderCameras =
        gltf.cameras;

    }

    console.log(
      "Cameras found:",
      blenderCameras.length
    );

    // -------------------------------------------------
    // SORT CAMERAS BY NAME
    // -------------------------------------------------
    //
    // This makes the order deterministic regardless of
    // how Blender/glTF happens to store the nodes.
    //
    // Expected:
    //
    // Camera_Hero
    // Camera_Service
    // Camera_About
    // Camera_Project
    // Camera_Testimonials
    // Camera_FAQ
    // Camera_Contact
    //

    const cameraOrder = [
      "Camera_Hero",
      "Camera_Service",
      "Camera_About",
      "Camera_Project",
      "Camera_Testimonials",
      "Camera_FAQ",
      "Camera_Contact",
    ];

    const orderedCameras = [];

    for (
      let i = 0;
      i < cameraOrder.length;
      i++
    ) {

      const expectedName =
        cameraOrder[i];

      const found =
        blenderCameras.find(
          (cam) =>
            cam.name ===
            expectedName
        );

      if (found) {

        orderedCameras.push(
          found
        );

      }

    }

    // -------------------------------------------------
    // FALLBACK
    // -------------------------------------------------
    //
    // If a camera name somehow changed during export,
    // use the GLB camera order instead of completely
    // failing.
    //

    if (
      orderedCameras.length !==
      CAMERA_COUNT
    ) {

      console.warn(
        "Named camera lookup did not find all 7 cameras."
      );

      console.warn(
        "Falling back to GLB camera order."
      );

      orderedCameras.length = 0;

      for (
        let i = 0;
        i <
        Math.min(
          blenderCameras.length,
          CAMERA_COUNT
        );
        i++
      ) {

        orderedCameras.push(
          blenderCameras[i]
        );

      }

    }

    // -------------------------------------------------
    // VERIFY
    // -------------------------------------------------

    console.log(
      "===================================="
    );

    console.log(
      "FINAL CAMERA ORDER"
    );

    console.log(
      "===================================="
    );

    orderedCameras.forEach(
      (camera, index) => {

        console.log(
          `${index + 1}: ${camera.name}`
        );

      }
    );

    // -------------------------------------------------
    // EXTRACT CAMERA WORLD TRANSFORMS
    // -------------------------------------------------

    cameraStates.length = 0;

    for (
      let i = 0;
      i <
      orderedCameras.length;
      i++
    ) {

      const sourceCamera =
        orderedCameras[i];

      // Make absolutely sure its world matrix is
      // current.

      sourceCamera.updateWorldMatrix(
        true,
        false
      );

      // World position
      sourceCamera.getWorldPosition(
        tempPosition
      );

      // World rotation
      sourceCamera.getWorldQuaternion(
        tempQuaternion
      );

      // -------------------------------------------------
      // SAVE IMMUTABLE CAMERA STATE
      // -------------------------------------------------

      const state = {

        name:
          sourceCamera.name,

        position:
          tempPosition.clone(),

        quaternion:
          tempQuaternion.clone(),

        fov:
          sourceCamera.fov,

        near:
          sourceCamera.near,

        far:
          sourceCamera.far,

      };

      cameraStates.push(
        state
      );

      console.log(
        `Camera ${i + 1}:`,
        state.name
      );

      console.log(
        "Position:",
        state.position
      );

      console.log(
        "Quaternion:",
        state.quaternion
      );

      console.log(
        "FOV:",
        state.fov
      );

    }

    // -------------------------------------------------
    // VERIFY CAMERA COUNT
    // -------------------------------------------------

    if (
      cameraStates.length === 0
    ) {

      console.error(
        "NO CAMERAS FOUND IN GLB."
      );

      return;

    }

    // -------------------------------------------------
    // INITIALIZE RENDER CAMERA
    // -------------------------------------------------
    //
    // Start exactly on Camera 1.
    //

    const firstCamera =
      cameraStates[0];

    renderCamera.position.copy(
      firstCamera.position
    );

    renderCamera.quaternion.copy(
      firstCamera.quaternion
    );

    renderCamera.fov =
      firstCamera.fov;

    renderCamera.near =
      firstCamera.near;

    renderCamera.far =
      firstCamera.far;

    renderCamera.aspect =
      window.innerWidth /
      window.innerHeight;

    renderCamera.updateProjectionMatrix();

    // -------------------------------------------------
    // READY
    // -------------------------------------------------

    console.log(
      "===================================="
    );

    console.log(
      "CAMERA SYSTEM READY"
    );

    console.log(
      `Using ${cameraStates.length} Blender cameras.`
    );

    console.log(
      "===================================="
    );

  },

  // ===================================================
  // LOADING PROGRESS
  // ===================================================

  (progress) => {

    if (
      progress.total > 0
    ) {

      const percent =
        (
          progress.loaded /
          progress.total *
          100
        ).toFixed(1);

      console.log(
        `Loading GLB: ${percent}%`
      );

    }

  },

  // ===================================================
  // ERROR
  // ===================================================

  (error) => {

    console.error(
      "===================================="
    );

    console.error(
      "FAILED TO LOAD GLB"
    );

    console.error(
      error
    );

    console.error(
      "===================================="
    );

  }
);

// =====================================================
// INTERPOLATION HELPERS
// =====================================================

const currentPosition =
  new THREE.Vector3();

const currentQuaternion =
  new THREE.Quaternion();

function easeInOut(
  t
) {

  return (
    t *
    t *
    (3 -
      2 *
      t)
  );

}

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
    CAMERA_SMOOTHING;

  // ---------------------------------------------------
  // WAIT UNTIL GLB CAMERAS ARE READY
  // ---------------------------------------------------

  if (
    cameraStates.length === 0
  ) {

    return;

  }

  // ---------------------------------------------------
  // CALCULATE CURRENT CAMERA INTERVAL
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
  // LOCAL PROGRESS BETWEEN TWO CAMERAS
  // ---------------------------------------------------

  const rawProgress =
    exact - index;

  const localProgress =
    easeInOut(
      rawProgress
    );

  const currentCamera =
    cameraStates[index];

  const nextCamera =
    cameraStates[next];

  // ---------------------------------------------------
  // POSITION INTERPOLATION
  // ---------------------------------------------------

  currentPosition.lerpVectors(
    currentCamera.position,
    nextCamera.position,
    localProgress
  );

  renderCamera.position.copy(
    currentPosition
  );

  // ---------------------------------------------------
  // ROTATION INTERPOLATION
  // ---------------------------------------------------
  //
  // Quaternion slerp prevents weird Euler-angle
  // flipping during transitions.
  //

  currentQuaternion.slerpQuaternions(
    currentCamera.quaternion,
    nextCamera.quaternion,
    localProgress
  );

  renderCamera.quaternion.copy(
    currentQuaternion
  );

  // ---------------------------------------------------
  // CAMERA PROJECTION
  // ---------------------------------------------------

  renderCamera.fov =
    THREE.MathUtils.lerp(
      currentCamera.fov,
      nextCamera.fov,
      localProgress
    );

  renderCamera.near =
    THREE.MathUtils.lerp(
      currentCamera.near,
      nextCamera.near,
      localProgress
    );

  renderCamera.far =
    THREE.MathUtils.lerp(
      currentCamera.far,
      nextCamera.far,
      localProgress
    );

  renderCamera.aspect =
    window.innerWidth /
    window.innerHeight;

  renderCamera.updateProjectionMatrix();

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  renderer.render(
    scene,
    renderCamera
  );

}

// =====================================================
// START
// =====================================================

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

    if (
      renderCamera
    ) {

      renderCamera.aspect =
        width /
        height;

      renderCamera.updateProjectionMatrix();

    }

  }
);
