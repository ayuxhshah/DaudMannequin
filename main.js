import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

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
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

const scene = new THREE.Scene()

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

const renderCamera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
)

let cameraStates = []
let scrollProgress = 0

/* =========================================================
   TEMP CAMERAS / LIGHTING
========================================================= */

// Soft lighting for the non-baked parts of the model.
// The mannequin body itself will use the baked lightmap.

const hemiLight = new THREE.HemisphereLight(
    0xffffff,
    0x222222,
    0.8
)

scene.add(hemiLight)

const keyLight = new THREE.DirectionalLight(
    0xffffff,
    1.0
)

keyLight.position.set(
    200,
    300,
    200
)

scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(
    0xffffff,
    0.35
)

fillLight.position.set(
    -200,
    150,
    -100
)

scene.add(fillLight)

/* =========================================================
   LOAD LIGHTMAP
========================================================= */

const textureLoader = new THREE.TextureLoader()

const lightmapTexture = textureLoader.load(
    "./Mannequin_Lightmap.png",
    () => {
        console.log("Lightmap loaded")
    },
    undefined,
    (error) => {
        console.error(
            "Failed to load Mannequin_Lightmap.png",
            error
        )
    }
)

// Lightmap is baked lighting data, NOT a color texture.
lightmapTexture.colorSpace =
    THREE.LinearSRGBColorSpace

lightmapTexture.flipY = false

/* =========================================================
   LOAD GLTF
========================================================= */

const loader = new GLTFLoader()

loader.load(
    "./DaudHeroWithCameras_WebGL.gltf",

    (gltf) => {
        console.log("GLTF loaded")

        /* -------------------------------------------------
           ADD MODEL
        ------------------------------------------------- */

        scene.add(gltf.scene)

        /* -------------------------------------------------
           BODY LIGHTMAP
        ------------------------------------------------- */

        let bakedBodyFound = false

        gltf.scene.traverse((object) => {
            if (!object.isMesh) {
                return
            }

            const meshName =
                object.name?.toLowerCase() || ""

            const materialName =
                object.material?.name?.toLowerCase() || ""

            const isBody =
                meshName.includes("mannequin_bod") ||
                materialName.includes("oil paint")

            if (!isBody) {
                return
            }

            console.log(
                "Body mesh found:",
                object.name
            )

            /* ---------------------------------------------
               VERIFY SECOND UV
            --------------------------------------------- */

            const uv1 =
                object.geometry.getAttribute("uv1")

            if (!uv1) {
                console.warn(
                    "Body mesh does NOT have uv1 / LightmapUV:",
                    object.name
                )

                return
            }

            console.log(
                "Body has LightmapUV / uv1"
            )

            /* ---------------------------------------------
               APPLY BAKED LIGHTMAP
            --------------------------------------------- */

            const materials = Array.isArray(
                object.material
            )
                ? object.material
                : [object.material]

            materials.forEach((material) => {
                if (!material) {
                    return
                }

                material.lightMap =
                    lightmapTexture

                material.lightMapIntensity = 0

                material.needsUpdate = true

                console.log(
                    "Lightmap applied to:",
                    material.name
                )
            })

            bakedBodyFound = true
        })

        if (!bakedBodyFound) {
            console.warn(
                "WARNING: Could not find mannequin body for lightmap."
            )
        }

        /* -------------------------------------------------
           CAMERA EXTRACTION
           THIS IS THE WORKING CAMERA SYSTEM
        ------------------------------------------------- */

        cameraStates = cameraOrder
            .map((cameraName) => {
                const camera =
                    gltf.cameras.find(
                        (cam) =>
                            cam.name === cameraName
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
                    name: camera.name,

                    position,
                    quaternion,

                    fov: camera.fov,
                    near: camera.near,
                    far: camera.far,
                }
            })
            .filter(Boolean)

        console.log(
            "Camera states:",
            cameraStates
        )

        /* -------------------------------------------------
           INITIAL CAMERA
        ------------------------------------------------- */

        if (cameraStates.length > 0) {
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

        /* -------------------------------------------------
           INITIAL SCROLL STATE
        ------------------------------------------------- */

        updateCamera(scrollProgress)

        console.log(
            "Daud mannequin ready."
        )
    },

    undefined,

    (error) => {
        console.error(
            "Failed to load DaudHeroWithCameras_WebGL.gltf",
            error
        )
    }
)

/* =========================================================
   CAMERA INTERPOLATION
   DO NOT CHANGE
========================================================= */

function updateCamera(progress) {
    if (cameraStates.length === 0) {
        return
    }

    const maxProgress =
        cameraStates.length - 1

    const clampedProgress =
        Math.max(
            0,
            Math.min(progress, maxProgress)
        )

    const index =
        Math.floor(clampedProgress)

    const nextIndex =
        Math.min(
            index + 1,
            cameraStates.length - 1
        )

    const t =
        clampedProgress - index

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

        if (event.data.type !== "scroll") {
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
                    cameraStates.length > 0
                        ? cameraStates.length - 1
                        : 6
                )
            )

        updateCamera(scrollProgress)
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
    requestAnimationFrame(animate)

    renderer.render(
        scene,
        renderCamera
    )
}

animate()
