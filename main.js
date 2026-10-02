import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";

// =====================================================
// CONFIG
// =====================================================

const GLB_FILE =
  "./DaudHeroWithCameras.glb";

const HDRI_FILE =
  "./studio_small_05_4k.exr";

const CAMERA_COUNT = 7;

const CAMERA_SMOOTHING = 0.08;

// =====================================================
// LIGHTING CONFIG
// =====================================================
//
// These are based on your Blender studio setup.
//
// Blender coordinates:
// X = X
// Y = -Z
// Z = Y
//
// Since the GLB already comes through the glTF
// coordinate conversion, we use the same conversion
// for the external Blender light positions.
//

// -----------------------------------------------------
// HDRI
// -----------------------------------------------------

const HDRI_INTENSITY = 0.35;

// -----------------------------------------------------
// AREA 1 — LARGE TOP / KEY
// -----------------------------------------------------

const AREA_1 = {
  position: {
    x: -2.3778,
    y: 276.22,
    z: 9.2933,
  },

  // Blender:
  // Rotation X = 0
  // Rotation Y = 0
  // Rotation Z = -90
  rotation: {
    x: 0,
    y: 0,
    z: -90,
  },

  // Blender:
  // Power 1000 W
  // Exposure 10.5
  // Size 300m
  //
  // We intentionally use a normalized Three.js
  // intensity rather than directly converting the
  // Blender wattage.

  intensity: 4.0,

  width: 300,
  height: 300,
};

// -----------------------------------------------------
// AREA 2 — SIDE / FILL
// -----------------------------------------------------

const AREA_2 = {
  position: {
    x: 105.36,
    y: 93.377,
    z: -181.51,
  },

  // Blender:
  // X = 90
  // Y = 0
  // Z = -210.82

  rotation: {
    x: 90,
    y: 0,
    z: -210.82,
  },

  intensity: 2.0,

  width: 153,
  height: 153,
};

// -----------------------------------------------------
// AREA 3 — OPPOSITE SIDE / RIM
// -----------------------------------------------------

const AREA_3 = {
  position: {
    x: -2.4176,
    y: 91.807,
    z: 194.19,
  },

  // Blender:
  // X = 90
  // Y = 0
  // Z = -359.53

  rotation: {
    x: 90,
    y: 0,
    z: -359.53,
  },

  intensity: 2.5,

  width: 250,
  height: 250,
};

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
// CAMERA
// =====================================================
//
// This is the render camera.
//
// The seven Blender cameras are loaded from the GLB
// and used as source states.
//
// DO NOT CHANGE THIS SYSTEM.
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
// HDRI ENVIRONMENT
// =====================================================

const pmremGenerator =
  new THREE.PMREMGenerator(
    renderer
  );

pmremGenerator.compileEquirectangularShader();

const exrLoader =
  new EXRLoader();

exrLoader.load(

  HDRI_FILE,

  (texture) => {

    console.log(
      "Studio HDRI loaded."
    );

    // -------------------------------------------------
    // Convert HDRI into a PMREM environment map.
    // -------------------------------------------------

    const environmentMap =
      pmremGenerator.fromEquirectangular(
        texture
      ).texture;

    scene.environment =
      environmentMap;

    // -------------------------------------------------
    // HDRI STRENGTH
    // -------------------------------------------------

    scene.environmentIntensity =
      HDRI_INTENSITY;

    // We want the HDRI to LIGHT the mannequin,
    // not appear as the website background.

    texture.dispose();

    pmremGenerator.dispose();

  },

  undefined,

  (error) => {

    console.error(
      "Failed to load studio HDRI:",
      error
    );

  }
);

// =====================================================
// STUDIO AREA LIGHT HELPER
// =====================================================

function createStudioAreaLight(
  config
) {

  const light =
    new THREE.RectAreaLight(
      0xffffff,
      config.intensity,
      config.width,
      config.height
    );

  // ---------------------------------------------------
  // POSITION
  // ---------------------------------------------------

  light.position.set(
    config.position.x,
    config.position.y,
    config.position.z
  );

  // ---------------------------------------------------
  // ROTATION
  // ---------------------------------------------------
  //
  // Blender and Three.js use different coordinate
  // systems.
  //
  // Rather than directly copying Euler angles,
  // we convert the Blender rotation basis.
  //

  const blenderEuler =
    new THREE.Euler(
      THREE.MathUtils.degToRad(
        config.rotation.x
      ),
      THREE.MathUtils.degToRad(
        config.rotation.y
      ),
      THREE.MathUtils.degToRad(
        config.rotation.z
      ),
      "XYZ"
    );

  const blenderQuaternion =
    new THREE.Quaternion();

  blenderQuaternion.setFromEuler(
    blenderEuler
  );

  // Blender local -Z is treated as the direction
  // the area light faces.

  const blenderForward =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  blenderForward.applyQuaternion(
    blenderQuaternion
  );

  // Blender → Three coordinate conversion.

  const forward =
    new THREE.Vector3(
      blenderForward.x,
      blenderForward.z,
      -blenderForward.y
    ).normalize();

  // Area lights in Three.js face local -Z.
  //
  // Build a quaternion whose -Z points along the
  // converted Blender direction.

  const target =
    light.position
      .clone()
      .add(forward);

  light.lookAt(
    target
  );

  scene.add(
    light
  );

  return light;
}

// =====================================================
// CREATE STUDIO LIGHTS
// =====================================================

const area1 =
  createStudioAreaLight(
    AREA_1
  );

const area2 =
  createStudioAreaLight(
    AREA_2
  );

const area3 =
  createStudioAreaLight(
    AREA_3
  );

// =====================================================
// VERY SOFT BASE FILL
// =====================================================
//
// The Blender HDRI + large area lights should do most
// of the work.
//
// This is intentionally subtle.
//

const softFill =
  new THREE.HemisphereLight(
    0xffffff,
    0x111111,
    0.12
  );

scene.add(
  softFill
);

// =====================================================
// SCROLL STATE
// =====================================================

let scrollTarget = 0;

let scroll = 0;

// =====================================================
// FRAMER → THREE SCROLL
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

// Temporary extraction objects.

const tempPosition =
  new THREE.Vector3();

const tempQuaternion =
  new THREE.Quaternion();

// =====================================================
// GLB LOADER
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
    // ADD COMPLETE BLENDER SCENE
    // -------------------------------------------------
    //
    // IMPORTANT:
    //
    // NO SCALE
    // NO POSITION
    // NO ROTATION
    //
    // The mannequin + cameras remain exactly as
    // exported from Blender.
    //

    scene.add(
      gltf.scene
    );

    // -------------------------------------------------
    // UPDATE WORLD MATRICES
    // -------------------------------------------------

    gltf.scene.updateMatrixWorld(
      true
    );

    // -------------------------------------------------
    // GET CAMERAS
    // -------------------------------------------------

    const blenderCameras =
      gltf.cameras || [];

    console.log(
      "Cameras found:",
      blenderCameras.length
    );

    // -------------------------------------------------
    // CAMERA ORDER
    // -------------------------------------------------

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
      i <
      cameraOrder.length;
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

    if (
      orderedCameras.length !==
      CAMERA_COUNT
    ) {

      console.warn(
        "Could not find all named cameras."
      );

      console.warn(
        "Using GLB camera order."
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
    // EXTRACT CAMERA STATES
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

      sourceCamera.updateWorldMatrix(
        true,
        false
      );

      sourceCamera.getWorldPosition(
        tempPosition
      );

      sourceCamera.getWorldQuaternion(
        tempQuaternion
      );

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
        `Camera ${i + 1}: ${state.name}`
      );

    }

    // -------------------------------------------------
    // INITIAL CAMERA
    // -------------------------------------------------

    if (
      cameraStates.length > 0
    ) {

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

    }

    console.log(
      "===================================="
    );

    console.log(
      "CAMERA SYSTEM READY"
    );

    console.log(
      "===================================="

    );

  },

  // ===================================================
  // PROGRESS
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
      "Failed to load GLB:",
      error
    );

  }
);

// =====================================================
// CAMERA INTERPOLATION
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
    CAMERA_SMOOTHING;

  // ---------------------------------------------------
  // WAIT FOR CAMERAS
  // ---------------------------------------------------

  if (
    cameraStates.length === 0
  ) {

    return;

  }

  // ---------------------------------------------------
  // CAMERA INTERVAL
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
  // POSITION
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
  // ROTATION
  // ---------------------------------------------------

  currentQuaternion.slerpQuaternions(
    currentCamera.quaternion,
    nextCamera.quaternion,
    localProgress
  );

  renderCamera.quaternion.copy(
    currentQuaternion
  );

  // ---------------------------------------------------
  // PROJECTION
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

    renderCamera.aspect =
      width /
      height;

    renderCamera.updateProjectionMatrix();

  }
);
