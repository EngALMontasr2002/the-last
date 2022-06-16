import * as THREE from "three"
import { getTexture } from "../../../utils/webgl/getTexture"
import fragment from "./shaders/fragment.glsl"
import fragmentPortal from "./shaders/fragmentPortal.glsl"
import vertex from "./shaders/vertex.glsl"


export default class Portal {
    constructor({ scene, renderer, paneObj, moduleInstance }) {
        // Args
        this.scene = scene
        this.renderer = renderer
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance

        // Data
        this.time = 0

        // Planes
        this.planes = []
        this.materials = []

        // Init
        this.init()
    }

    ///////////////
    // Lifecycle
    /////////////// 
    async init() {
        console.log(`${this.moduleInstance.playgroundId}: init`)

        this.portalTexture = await getTexture('/assets/images/temp/portal.jpg').promise;

        // Setup pane
        this.setupPane()

        // Set planes
        this.setPlane()
        this.setPortalPlane()

        // Portal uniforms
        this.setPortalTextureUniforms()
    }

    destroy() {
        console.log(`${this.moduleInstance.playgroundId}: destroy`)
    }

    /////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////
    resize() {
        // Update resolution
        this.setResolutionUniforms()
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
        // const { x, y, smoothX, smoothY } = mouseCoords
        // console.log(`${this.moduleInstance.playgroundId}: mouseMove`, mouseCoords)
    }

    ///////////////
    // Methods
    ///////////////
    setPlane() {
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

        this.planes.push(this.plane)
    }

    setPortalPlane() {
        // Set Material
        this.materialPortal = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uResolution: { value: [0, 0] },
                uPortalTexture: { value: null },
                uPortalTextureResolution: { value: [0, 0] },
            },
            // wireframe: true,
            transparent: true,
            vertexShader: vertex,
            fragmentShader: fragmentPortal
        })

        this.materials.push(this.materialPortal)

        // Set Geometry
        this.geometryPortal = new THREE.PlaneGeometry(1, 1, 1, 1)

        // Create plane
        this.planePortal = new THREE.Mesh(this.geometryPortal, this.materialPortal)

        // Then add it to scene
        this.scene.add(this.planePortal)

        this.planes.push(this.planePortal)
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
        this.materialPortal.uniforms.uPortalTexture.value = this.portalTexture
        this.materialPortal.uniforms.uPortalTextureResolution.value = [texWidth, texHeight]
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