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
    2.0,
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
   INTRO REVEAL  (plays once, then hands off to scroll)
   ---------------------------------------------------------
   1. Camera starts wide + orbited, pushes into Camera_Hero
   2. Mannequin appears as black linework (silhouette +
      horizontal scan lines)
   3. A pink block-scan sweeps bottom → top and reveals
      the real materials

   Tuning: change values in INTRO below.
   Debug in the URL:
     ?intro=0.4   freeze the intro at 40% (0 → 1)
     ?intro=off   skip the intro
========================================================= */

const INTRO = {
    duration: 3.4, // seconds, whole intro

    // timing windows, as fractions of duration (0 → 1)
    outlineIn: [0.0, 0.18], // linework fades in
    scan: [0.15, 0.95], // block scan sweeps up

    // camera start pose, relative to Camera_Hero
    pullBack: 1.9, // distance multiplier
    orbitDeg: -38, // swing around the model (degrees)
    rise: 35, // extra height at start (scene units)
    fovBoost: 6, // extra FOV at start (degrees)

    // look
    lineColor: "#0a0a0a",
    scanColor: "#ff2e93",
    blockSize: 4.5, // size of scan blocks (scene units)
    bandWidth: 16, // height of the pink band
    jitter: 18, // how ragged the scan front is
    lineSpacing: 7, // gap between horizontal scan lines
    lineOpacity: 0.5, // scan line strength (silhouette is always full)

    // false = once per page load
    // true  = once per browser tab session (skips on reload)
    oncePerSession: false,
}

const introParam =
    new URLSearchParams(
        window.location.search
    ).get("intro")

const introDebugT =
    introParam !== null &&
    !isNaN(parseFloat(introParam))
        ? THREE.MathUtils.clamp(
              parseFloat(introParam),
              0,
              1
          )
        : null

let introSkip = introParam === "off"

if (INTRO.oncePerSession && !introSkip) {
    try {
        introSkip =
            sessionStorage.getItem(
                "daudIntroPlayed"
            ) === "1"
    } catch (e) {}
}

/* ---------------------------------------------------------
   Shared uniforms for the reveal shader
--------------------------------------------------------- */

function toOutputColor(hex) {
    // gl_FragColor is written after tone mapping / sRGB,
    // so feed raw sRGB values to match the hex exactly
    return new THREE.Color(hex)
        .convertLinearToSRGB()
}

const revealUniforms = {
    uRevealHeight: { value: -1e6 },
    uOutline: { value: 0 },
    uBlock: { value: INTRO.blockSize },
    uBand: { value: INTRO.bandWidth },
    uJitter: { value: INTRO.jitter },
    uLineSpacing: { value: INTRO.lineSpacing },
    uLineOpacity: { value: INTRO.lineOpacity },
    uLineColor: {
        value: toOutputColor(INTRO.lineColor),
    },
    uScanColor: {
        value: toOutputColor(INTRO.scanColor),
    },
}

if (introSkip) {
    revealUniforms.uRevealHeight.value = 1e6
    revealUniforms.uOutline.value = 0
}

function applyRevealShader(material) {
    material.onBeforeCompile = (shader) => {
        Object.assign(
            shader.uniforms,
            revealUniforms
        )

        shader.vertexShader =
            "varying vec3 vRevealWorld;\n" +
            shader.vertexShader.replace(
                "#include <project_vertex>",
                `#include <project_vertex>
                vRevealWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`
            )

        shader.fragmentShader =
            `varying vec3 vRevealWorld;
            uniform float uRevealHeight;
            uniform float uOutline;
            uniform float uBlock;
            uniform float uBand;
            uniform float uJitter;
            uniform float uLineSpacing;
            uniform float uLineOpacity;
            uniform vec3 uLineColor;
            uniform vec3 uScanColor;

            float revealHash( vec3 p ) {
                p = fract( p * 0.3183099 + 0.1 );
                p *= 17.0;
                return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
            }
            ` +
            shader.fragmentShader.replace(
                "void main() {",
                `void main() {
                vec3 rCell = floor( vRevealWorld / uBlock );
                float rRand = revealHash( rCell );
                float rFront = uRevealHeight
                    - ( rCell.y + 0.5 ) * uBlock
                    + ( rRand - 0.5 ) * uJitter;

                if ( rFront < 0.0 ) {
                    // ---- not revealed yet: linework only ----
                    vec3 rNorm = normalize( vNormal );
                    float rFacing = abs( dot( rNorm, normalize( vViewPosition ) ) );
                    float rRim = 1.0 - smoothstep( 0.18, 0.32, rFacing );

                    float rC = vRevealWorld.y / uLineSpacing;
                    float rD = abs( fract( rC - 0.5 ) - 0.5 ) / max( fwidth( rC ), 1e-4 );
                    float rScan = 1.0 - clamp( rD, 0.0, 1.0 );
                    // scan lines on the near surface only, or they double up
                    rScan *= gl_FrontFacing ? uLineOpacity : 0.0;

                    float rLine = max( rRim, rScan ) * uOutline;
                    if ( rLine < 0.02 ) discard;

                    // premultiplied, canvas is transparent
                    gl_FragColor = vec4( uLineColor * rLine, rLine );
                    return;
                }

                if ( rFront < uBand ) {
                    // ---- the pink scan band ----
                    float rFlick = 0.82 + 0.36 * rRand;
                    gl_FragColor = vec4( min( uScanColor * rFlick, vec3( 1.0 ) ), 1.0 );
                    return;
                }
                `
            )
    }

    material.customProgramCacheKey =
        () => "daud-reveal"
}

/* ---------------------------------------------------------
   Intro state
--------------------------------------------------------- */

const intro = {
    ready: { gltf: false, hdri: false },
    started: false,
    done: introSkip,
    startTime: 0,
    focus: new THREE.Vector3(),
    minY: 0,
    maxY: 1,
}

function markReady(what) {
    intro.ready[what] = true

    if (
        !intro.ready.gltf ||
        !intro.ready.hdri ||
        intro.started ||
        intro.done
    ) {
        return
    }

    // compile shaders before starting the clock,
    // so the first frames don't hitch
    const begin = () => {
        intro.started = true
        intro.startTime = performance.now()
        console.log("Intro reveal started")
    }

    if (renderer.compileAsync) {
        renderer
            .compileAsync(scene, renderCamera)
            .then(begin, begin)
    } else {
        begin()
    }
}

const easeInOutCubic = (t) =>
    t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

const easeInOutSine = (t) =>
    -(Math.cos(Math.PI * t) - 1) / 2

const easeOutCubic = (t) =>
    1 - Math.pow(1 - t, 3)

const windowT = (t, [a, b]) =>
    THREE.MathUtils.clamp(
        (t - a) / (b - a),
        0,
        1
    )

const _lookMatrix = new THREE.Matrix4()
const _up = new THREE.Vector3(0, 1, 0)

function lookQuaternion(from, to, target) {
    _lookMatrix.lookAt(from, to, _up)
    return target.setFromRotationMatrix(
        _lookMatrix
    )
}

const _target = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    fov: 35,
}
const _offset = new THREE.Vector3()
const _sphStart = new THREE.Spherical()
const _sphTarget = new THREE.Spherical()
const _lookQ = new THREE.Quaternion()
const _localQ = new THREE.Quaternion()

function applyIntro(t) {
    /* ------------- reveal shader ------------- */

    const outlineT = easeOutCubic(
        windowT(t, INTRO.outlineIn)
    )

    const scanT = easeInOutSine(
        windowT(t, INTRO.scan)
    )

    const pad =
        INTRO.jitter * 0.5 + INTRO.bandWidth

    revealUniforms.uOutline.value = outlineT

    revealUniforms.uRevealHeight.value =
        THREE.MathUtils.lerp(
            intro.minY - pad,
            intro.maxY + pad,
            scanT
        )

    /* ------------- camera push ------------- */

    // where the scroll system wants the camera right now
    _target.position.copy(renderCamera.position)
    _target.quaternion.copy(renderCamera.quaternion)
    _target.fov = renderCamera.fov

    const camT = easeInOutSine(t)

    // orbit in spherical coords around the model
    _offset
        .copy(_target.position)
        .sub(intro.focus)
    _sphTarget.setFromVector3(_offset)

    _sphStart.copy(_sphTarget)
    _sphStart.radius *= INTRO.pullBack
    _sphStart.theta += THREE.MathUtils.degToRad(
        INTRO.orbitDeg
    )
    _sphStart.phi = Math.max(
        0.05,
        _sphStart.phi -
            Math.atan2(
                INTRO.rise,
                _sphStart.radius
            )
    )

    const sph = new THREE.Spherical(
        THREE.MathUtils.lerp(
            _sphStart.radius,
            _sphTarget.radius,
            camT
        ),
        THREE.MathUtils.lerp(
            _sphStart.phi,
            _sphTarget.phi,
            camT
        ),
        THREE.MathUtils.lerp(
            _sphStart.theta,
            _sphTarget.theta,
            camT
        )
    )

    renderCamera.position
        .setFromSpherical(sph)
        .add(intro.focus)

    // keep the target camera's framing (its offset from
    // looking straight at the model) the whole way in
    lookQuaternion(
        _target.position,
        intro.focus,
        _lookQ
    )
    _localQ
        .copy(_lookQ)
        .invert()
        .multiply(_target.quaternion)

    lookQuaternion(
        renderCamera.position,
        intro.focus,
        renderCamera.quaternion
    ).multiply(_localQ)

    renderCamera.fov =
        _target.fov +
        INTRO.fovBoost * (1 - camT)

    renderCamera.updateProjectionMatrix()
}

function finishIntro() {
    intro.done = true
    revealUniforms.uRevealHeight.value = 1e6
    revealUniforms.uOutline.value = 0
    updateCamera(scrollProgress)

    if (INTRO.oncePerSession) {
        try {
            sessionStorage.setItem(
                "daudIntroPlayed",
                "1"
            )
        } catch (e) {}
    }

    console.log("Intro reveal finished")
}

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

        markReady("hdri")
    },

    undefined,

    (error) => {
        console.error(
            "Failed to load studio HDRI:",
            error
        )

        // don't block the intro if the HDRI fails
        markReady("hdri")
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

                        /*
                            Intro reveal shader
                        */

                        applyRevealShader(
                            material
                        )
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

        /* =================================================
           INTRO: model bounds for the scan + camera orbit
        ================================================= */

        gltf.scene.updateMatrixWorld(true)

        const bounds =
            new THREE.Box3().setFromObject(
                gltf.scene,
                true
            )

        bounds.getCenter(intro.focus)
        intro.minY = bounds.min.y
        intro.maxY = bounds.max.y

        markReady("gltf")
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

    /* ---------- intro reveal ---------- */

    if (!intro.done && cameraStates.length > 0) {
        // start from wherever scroll wants the camera
        updateCamera(scrollProgress)

        if (introDebugT !== null) {
            applyIntro(introDebugT)
        } else if (intro.started) {
            const t =
                (performance.now() -
                    intro.startTime) /
                (INTRO.duration * 1000)

            if (t >= 1) {
                finishIntro()
            } else {
                applyIntro(t)
            }
        } else {
            // still loading: keep everything hidden
            applyIntro(0)
            revealUniforms.uOutline.value = 0
        }
    }

    renderer.render(
        scene,
        renderCamera
    )
}

animate()
