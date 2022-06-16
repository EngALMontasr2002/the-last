import * as THREE from "three"
import fragment from "./shaders/fragment.glsl"
import vertex from "../../shaders/vertex.glsl"
import commonSceneUniforms from "../../mixins/commonSceneUniforms"
import commonSceneMethods from "../../mixins/commonSceneMethods"

export default class Depthmap {

    constructor({ id, $el, moduleInstance }) {

        // Mixin commons scene methods
        Object.assign(this, commonSceneMethods)
            // Mixin commons uniforms
        Object.assign(this, commonSceneUniforms)

        // DOM
        this.$el = $el

        // Data
        this.id = id
        this.moduleInstance = moduleInstance
        this.time = 0

        // Prepare render tartget stuff
        this.createScene ? .()
        this.createCamera ? .()
        this.createRtTexture ? .()

        // Init Canvas
        this.init()
    }

    ///////////////
    // Lifecycle
    ///////////////
    async init() {
        // Set planes
        this.setPlane()

        // Texture uniforms
        this.setResolutionUniforms ? .(this.$el.offsetWidth, this.$el.offsetHeight)
    }

    ///////////////
    // Events
    ///////////////
    resize(width, height) {
        this.compute(width, height)
    }

    update(time, deltaTime, frame) {
        this.material.uniforms.uTime.value = time;
    }

    mouseMove(mouseCoords) {
        let { x, y, smoothX, smoothY } = mouseCoords

        const halfX = this.material.uniforms.uResolution.value[0] / 2
        const halfY = this.material.uniforms.uResolution.value[1] / 2

        // Convert to shader coords
        x = (halfX - smoothX) / halfX
        y = (halfY - smoothY) / halfY

        this.material.uniforms.uMouse.value = [x, y]
    }

    ///////////////
    // Plane
    ///////////////
    setPlane() {
        // Set Material
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                uMouse: {
                    value: [0, 0]
                },
                uThreshold: {
                    value: [65, 80]
                },
                uTime: {
                    value: 0
                },

                uResolution: {
                    value: [0, 0]
                },
                uBackgroundTexture: {
                    value: null
                },
                uBackgroundTextureResolution: {
                    value: [0, 0]
                },
                uDepthmapTexture: {
                    value: null
                },
                uDepthmapTextureResolution: {
                    value: [0, 0]
                },
            },
            // wireframe: true,
            // transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment
        })

        // Set Geometry
        const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

        // Create plane
        this.plane = new THREE.Mesh(geometry, this.material)

        // Then add it to scene
        this.scene.add(this.plane)
    }

    ///////////////
    // Textures
    ///////////////
    setTextures(backgroundTexture, depthmapTexture) {
        this.setTextureUniforms ? .(backgroundTexture, 'uBackgroundTexture')
        this.setTextureUniforms ? .(depthmapTexture, 'uDepthmapTexture')
    }

    ///////////////
    // Methods
    ///////////////
    compute(width, height) {
        this.resizeRtTexture ? .(width, height)
            // Set resolution uniforms
        this.setResolutionUniforms ? .(width, height)
    }
}