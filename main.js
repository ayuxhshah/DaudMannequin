import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { EXRLoader } from "three/addons/loaders/EXRLoader.js"
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js"

/* =========================================================
   BASIC SETUP
========================================================= */

const canvas = document.getElementById("heroCanvas")

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
})

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
)

renderer.setSize(
    window.innerWidth,
    window.innerHeight
)

renderer.outputColorSpace = THREE.SRGBColorSpace

renderer.toneMapping =
    THREE.ACESFilmicToneMapping

renderer.toneMappingExposure = 0.65

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene()

/*
    Keep the background transparent.
    The HDRI is used for lighting only.
*/

scene.background = null

/* =========================================================
   RECT AREA LIGHT SUPPORT
========================================================= */

RectAreaLightUniformsLib.init()

/* =========================================================
   WEBGL LIGHTING
========================================================= */

/*
    We are intentionally NOT using:

    - lightMap
    - baked lighting
    - Mannequin_Lightmap.png

    Everything below is real-time WebGL lighting.
*/

/* ---------------------------------------------------------
   SOFT KEY
--------------------------------------------------------- */

const keyLight = new THREE.RectAreaLight(
    0xffffff,
    2.1,
    450,
    450
)

keyLight.position.set(
    -120,
    220,
    180
)

keyLight.lookAt(
    0,
    80,
    0
)

scene.add(keyLight)

/* ---------------------------------------------------------
   SOFT FRONT / FILL
--------------------------------------------------------- */

const fillLight = new THREE.RectAreaLight(
    0xffffff,
    1.5,
    250,
    250
)

fillLight.position.set(
    120,
    130,
    180
)

fillLight.lookAt(
    0,
    70,
    0
)

scene.add(fillLight)

/* ---------------------------------------------------------
   SOFT BACK / RIM
--------------------------------------------------------- */

const rimLight = new THREE.RectAreaLight(
    0xffffff,
    2.5,
    300,
    300
)

rimLight.position.set(
    -100,
    180,
    -180
)

rimLight.lookAt(
    0,
    90,
    0
)

scene.add(rimLight)

/* ---------------------------------------------------------
   VERY SOFT AMBIENT FILL
--------------------------------------------------------- */

const ambientLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x181818,
        0.2
    )

scene.add(ambientLight)

/* =========================================================
   HDRI ENVIRONMENT
========================================================= */

const pmremGenerator =
    new THREE.PMREMGenerator(renderer)

pmremGenerator.compileEquirectangularShader()

const exrLoader =
    new EXRLoader()

exrLoader.load(
    "./studio_small_05_4k.exr",

    (exrTexture) => {
        console.log(
            "HDRI loaded successfully"
        )

        exrTexture.mapping =
            THREE.EquirectangularReflectionMapping

        const environmentMap =
            pmremGenerator.fromEquirectangular(
                exrTexture
            ).texture

        scene.environment =
            environmentMap

        /*
            We don't want the HDRI visible
            behind the mannequin.
        */

        scene.background = null

        exrTexture.dispose()

        pmremGenerator.dispose()
    },

    undefined,

    (error) => {
        console.error(
            "Failed to load studio HDRI:",
            error
        )
    }
)

/* =========================================================
   CAMERA SYSTEM
   DO NOT CHANGE
========================================================= */

const cameraOrder = [
    "Camera_Hero",
    "Camera_Service",
    "Camera_About",
    "Camera_Project",
    "Camera_Testimonials",
    "Camera_FAQ",
    "Camera_Contact",
]

const renderCamera =
    new THREE.PerspectiveCamera(
        35,
        window.innerWidth /
            window.innerHeight,
        0.1,
        5000
    )

let cameraStates = []

let scrollProgress = 0

/* =========================================================
   LOAD GLTF
========================================================= */

const loader = new GLTFLoader()

loader.load(
    "./DaudHeroWithCameras_WebGL.gltf",

    (gltf) => {
        console.log(
            "GLTF loaded"
        )

        /* -------------------------------------------------
           ADD MODEL
        ------------------------------------------------- */

        scene.add(gltf.scene)

        /* -------------------------------------------------
           MATERIAL SETUP
        ------------------------------------------------- */

        gltf.scene.traverse(
            (object) => {
                if (!object.isMesh) {
                    return
                }

                const materials =
                    Array.isArray(
                        object.material
                    )
                        ? object.material
                        : [
                              object.material,
                          ]

                materials.forEach(
                    (material) => {
                        if (!material) {
                            return
                        }

                        /*
                            Completely remove
                            baked lightmap usage.
                        */

                        material.lightMap =
                            null

                        material.lightMapIntensity =
                            0

                        /*
                            Let the HDRI contribute
                            to the PBR material.
                        */

                        if (
                            "envMapIntensity" in
                            material
                        ) {
                            material.envMapIntensity =
                                0.8
                        }

                        /*
                            Make sure Three.js
                            recompiles the material.
                        */

                        material.needsUpdate =
                            true
                    }
                )
            }
        )

        console.log(
            "Real-time WebGL lighting enabled"
        )

        /* =================================================
           CAMERA EXTRACTION
        ================================================= */

        cameraStates =
            cameraOrder
                .map(
                    (cameraName) => {
                        const camera =
                            gltf.cameras.find(
                                (cam) =>
                                    cam.name ===
                                    cameraName
                            )

                        if (!camera) {
                            console.error(
                                `Camera not found: ${cameraName}`
                            )

                            return null
                        }

                        const position =
                            new THREE.Vector3()

                        const quaternion =
                            new THREE.Quaternion()

                        camera.getWorldPosition(
                            position
                        )

                        camera.getWorldQuaternion(
                            quaternion
                        )

                        return {
                            name:
                                camera.name,

                            position,

                            quaternion,

                            fov:
                                camera.fov,

                            near:
                                camera.near,

                            far:
                                camera.far,
                        }
                    }
                )
                .filter(Boolean)

        console.log(
            "Camera states:",
            cameraStates
        )

        /* =================================================
           INITIAL CAMERA
        ================================================= */

        if (
            cameraStates.length >
            0
        ) {
            renderCamera.position.copy(
                cameraStates[0].position
            )

            renderCamera.quaternion.copy(
                cameraStates[0].quaternion
            )

            renderCamera.fov =
                cameraStates[0].fov

            renderCamera.near =
                cameraStates[0].near

            renderCamera.far =
                cameraStates[0].far

            renderCamera.updateProjectionMatrix()
        }

        /* =================================================
           INITIAL SCROLL
        ================================================= */

        updateCamera(
            scrollProgress
        )

        console.log(
            "Daud mannequin ready."
        )
    },

    undefined,

    (error) => {
        console.error(
            "Failed to load GLTF:",
            error
        )
    }
)

/* =========================================================
   CAMERA INTERPOLATION
   DO NOT CHANGE
========================================================= */

function updateCamera(
    progress
) {
    if (
        cameraStates.length ===
        0
    ) {
        return
    }

    const maxProgress =
        cameraStates.length - 1

    const clampedProgress =
        Math.max(
            0,
            Math.min(
                progress,
                maxProgress
            )
        )

    const index =
        Math.floor(
            clampedProgress
        )

    const nextIndex =
        Math.min(
            index + 1,
            cameraStates.length - 1
        )

    const t =
        clampedProgress -
        index

    const current =
        cameraStates[index]

    const next =
        cameraStates[nextIndex]

    /* -------------------------------------------------
       POSITION
    ------------------------------------------------- */

    renderCamera.position.lerpVectors(
        current.position,
        next.position,
        t
    )

    /* -------------------------------------------------
       ROTATION
    ------------------------------------------------- */

    renderCamera.quaternion.slerpQuaternions(
        current.quaternion,
        next.quaternion,
        t
    )

    /* -------------------------------------------------
       CAMERA PROPERTIES
    ------------------------------------------------- */

    renderCamera.fov =
        THREE.MathUtils.lerp(
            current.fov,
            next.fov,
            t
        )

    renderCamera.near =
        THREE.MathUtils.lerp(
            current.near,
            next.near,
            t
        )

    renderCamera.far =
        THREE.MathUtils.lerp(
            current.far,
            next.far,
            t
        )

    renderCamera.updateProjectionMatrix()
}

/* =========================================================
   FRAMER → THREE.JS SCROLL BRIDGE
========================================================= */

window.addEventListener(
    "message",
    (event) => {
        if (!event.data) {
            return
        }

        if (
            event.data.type !==
            "scroll"
        ) {
            return
        }

        if (
            typeof event.data.progress !==
            "number"
        ) {
            return
        }

        scrollProgress =
            Math.max(
                0,
                Math.min(
                    event.data.progress,
                    cameraStates.length >
                        0
                        ? cameraStates.length -
                              1
                        : 6
                )
            )

        updateCamera(
            scrollProgress
        )
    }
)

/* =========================================================
   RESIZE
========================================================= */

function handleResize() {
    const width =
        window.innerWidth

    const height =
        window.innerHeight

    renderer.setSize(
        width,
        height
    )

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    )

    renderCamera.aspect =
        width / height

    renderCamera.updateProjectionMatrix()
}

window.addEventListener(
    "resize",
    handleResize
)

/* =========================================================
   RENDER LOOP
========================================================= */

function animate() {
    requestAnimationFrame(
        animate
    )

    renderer.render(
        scene,
        renderCamera
    )
}

animate()
