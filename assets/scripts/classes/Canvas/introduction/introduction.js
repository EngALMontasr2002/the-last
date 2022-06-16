import gsap, { mapRange } from "gsap/all"
import * as THREE from "three"
import { clamp } from "three/src/math/MathUtils"
import { getTexture } from "../../../utils/webgl/getTexture"
import fragment from "./shaders/fragment.glsl"
import fragmentPortal from "./shaders/fragmentPortal.glsl"
import vertex from "./shaders/vertex.glsl"

/////////////////////////////////////////////
// Constants
/////////////////////////////////////////////
const DEFAULT_PORTAL_CIRCLE_WIDTH = 288 // Based on mask texture
export default class Introduction {
    constructor({ scene, renderer, paneObj, moduleInstance }) {
        // Args
        this.scene = scene
        this.renderer = renderer
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance

        // Data
        this.time = 0

        // Planes
        this.portalsCount = 20
        this.portalsPool = []
        this.materials = []

        // Mouse
        this.lastMouseX = 0

        // Animation 
        this.animationDuration = 3
        this.portalsInView = 16

        // Init
        this.init()
    }

    ///////////////
    // Lifecycle
    /////////////// 
    async init() {
        console.log(`${this.moduleInstance.playgroundId}: init`)

        this.portalTexture = await getTexture('/assets/images/temp/mask.jpg').promise;

        // Setup pane
        this.setupPane()

        // Set planes
        this.setBackgroundPlane()
        this.setPortalPlanes()

        // Portal uniforms
        this.setPortalTextureUniforms()

        this.resize()

        gsap.to(this.portalsPool, {
            progress: 1.6,
            duration: this.animationDuration,
            ease: 'power3.inOut',
            stagger: this.animationDuration * 1 / this.portalsInView,
            onUpdate: () => {
                let index = 0
                while (index < this.portalsPool.length) {
                    const portal = this.portalsPool[index]
                    if (!portal) return
                    portal.material.uniforms.uProgress.value = portal.progress
                    index++
                }
            }
        })
    }

    destroy() {
        console.log(`${this.moduleInstance.playgroundId}: destroy`)
    }

    /////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////
    resize() {
        // Compute width
        this.width = this.renderer.domElement.offsetWidth
        this.height = this.renderer.domElement.offsetHeight

        // Compute values
        this.compute(this.width, this.height)
    }

    update(time, deltaTime, frame) {
        // Increment time
        this.time += 0.01

        // RAF uniforms
        let materialIndex = 0
        while (materialIndex < this.materials.length) {
            const material = this.materials[materialIndex]
            material.uniforms.uTime.value = this.time
            materialIndex++
        }
    }

    pointerDown() {
        console.log(`${this.moduleInstance.playgroundId}: pointerDown`)
    }

    pointerUp() {
        console.log(`${this.moduleInstance.playgroundId}: pointerUp`)
    }

    mouseMove(mouseCoords) {
        let { x, y, smoothX, smoothY } = mouseCoords

        const mouseVelocity = clamp((smoothX - this.lastMouseX) / 20, -1, 1)

        let portalIndex = 0
        while (portalIndex < this.portalsPool.length) {
            const portal = this.portalsPool[portalIndex]

            const halfX = portal.material.uniforms.uResolution.value[0] / 2
            const halfY = portal.material.uniforms.uResolution.value[1] / 2

            // Convert to shader coords
            const normalizedx = (halfX - smoothX) / halfX
            const normalizedy = (halfY - smoothY) / halfY

            portal.material.uniforms.uMouse.value = [normalizedx, normalizedy]
            portal.material.uniforms.uMouseVelocity.value = mouseVelocity

            portalIndex++
        }

        this.lastMouseX = smoothX
    }

    ///////////////
    // Methods
    ///////////////
    setBackgroundPlane() {
        // Set Material
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uResolution: { value: [0, 0] },
            },
            // wireframe: true,
            // transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment
        })

        this.materials.push(this.material)

        // Set Geometry
        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

        // Create plane
        this.plane = new THREE.Mesh(this.geometry, this.material)

        // Then add it to scene
        this.scene.add(this.plane)
    }

    setPortalPlanes() {
        let portalIndex = 0

        while (portalIndex < this.portalsCount) {
            // Set Material
            const material = new THREE.ShaderMaterial({
                extensions: {
                    derivatives: "#extension GL_OES_standard_derivatives : enable"
                },
                side: THREE.DoubleSide,
                uniforms: {
                    uTime: { value: 0 },
                    uMouseVelocity: { value: 0 },
                    uMouse: { value: [0, 0] },
                    uThreshold: { value: [5, 95] },
                    uProgress: { value: 0 },
                    uResolution: { value: [0, 0] },
                    uPortalTexture: { value: null },
                    uPortalTextureResolution: { value: [0, 0] },
                    uIndex: { value: portalIndex },
                    uMaxMaskScale: { value: 0 },
                },
                vertexShader: vertex,
                fragmentShader: fragmentPortal,
                transparent: true,
                depthWrite: true
            })

            this.materials.push(material)

            // Set Geometry
            this.geometryPortal = new THREE.PlaneGeometry(1, 1, 1, 1)

            // Create plane
            const planePortal = new THREE.Mesh(this.geometryPortal, material)

            planePortal.progress = 0

            // Then add it to scene
            this.scene.add(planePortal)

            // Store to portals pool
            this.portalsPool.push(planePortal)

            // Change render order
            planePortal.renderOrder = this.portalsCount - portalIndex;

            portalIndex++
        }

        this.portalsPool.forEach((portal, index) => {
            portal.material.uniforms.uProgress.value = .25
        })
    }

    compute(width, height) {
        // Update resolution
        this.setResolutionUniforms ? .(width, height)

        // Reset uniforms
        this.reset()
    }

    computeMaskTextureScale(maskTexture) {
        if (!maskTexture) return 1

        const canvasWidth = this.renderer.domElement.offsetWidth
        const canvasHeight = this.renderer.domElement.offsetHeight
        const originalTexWidth = maskTexture.image.width
        const originalTexHeight = maskTexture.image.height

        const tAspect = originalTexWidth / originalTexHeight;
        const pAspect = canvasWidth / canvasHeight;
        const pwidth = canvasWidth;
        const pheight = canvasHeight;

        let currentTexWidth = 0;

        if (tAspect > pAspect) {
            currentTexWidth = pheight * tAspect;
        } else {
            currentTexWidth = pwidth;
        }

        return currentTexWidth / originalTexWidth
    }

    reset() {
        // Compute mask max scale
        const maskTextureScale = this.computeMaskTextureScale(this.maskTexture)
        console.log(this.setMaxMaskScaleUniforms ? .(maskTextureScale))
    }

    /////////////////////////////////////////////
    // Uniforms
    /////////////////////////////////////////////
    setResolutionUniforms() {
        const canvasWidth = this.renderer.domElement.offsetWidth
        const canvasHeight = this.renderer.domElement.offsetHeight

        let materialIndex = 0
        while (materialIndex < this.materials.length) {
            const material = this.materials[materialIndex]
            material.uniforms.uResolution.value = [canvasWidth, canvasHeight]
            materialIndex++
        }
    }

    setPortalTextureUniforms() {
        const texWidth = this.portalTexture.image.width
        const texHeight = this.portalTexture.image.height

        this.portalsPool.forEach((portal) => {
            portal.material.uniforms.uPortalTexture.value = this.portalTexture
            portal.material.uniforms.uPortalTextureResolution.value = [texWidth, texHeight]
        })
    }

    setMaxMaskScaleUniforms(maskTextureScale) {
        const canvasWidth = this.renderer.domElement.offsetWidth
        const canvasHeight = this.renderer.domElement.offsetHeight

        // 1. Get texture scale (values based on background UV)
        const circleWidth = DEFAULT_PORTAL_CIRCLE_WIDTH * maskTextureScale

        // 2. Get mask original scale (use pythagore to cover a maximum of possibilities)
        const pythA = canvasHeight / 2
        const pythB = canvasWidth / 2
        const hypot = Math.hypot(pythA, pythB)

        // 3. Result
        const originalScale = (hypot / circleWidth) * 2
        const roundedScale = Math.round((originalScale + Number.EPSILON) * 100) / 100

        this.portalsPool.forEach((portal) => {
            portal.material.uniforms.uMaxMaskScale.value = roundedScale
        })

        return roundedScale
    }

    ///////////////
    // PANE
    ///////////////
    setupPane() {
        if (!this.paneObj) return

        // Create folder
        const folder = this.paneObj.pane.addFolder({
            title: 'Portal',
            expanded: true
        });

        // Progress
        this.paneObj.params.progress = 0
        folder
            .addInput(this.paneObj.params, 'progress', { min: 0, max: 1 })
            .on('change', (ev) => {
                const value = ev.value
                if (this.material) {
                    this.material.uniforms.uProgress.value = value
                }
            });
    }
}