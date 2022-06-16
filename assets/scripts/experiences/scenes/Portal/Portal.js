import * as THREE from "three"
import { getTexture } from "../../../utils/webgl/getTexture"
import fragment from "./shaders/fragment.glsl"
import vertex from "../../shaders/vertex.glsl"
import commonSceneUniforms from "../../mixins/commonSceneUniforms"
import commonSceneMethods from "../../mixins/commonSceneMethods"
export default class Portal {

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
        // Get portal texture
        // this.texture = await getTexture('/assets/images/temp/portal-blur.jpg').promise;

        // Set plane
        this.setPlane()

        // Texture uniforms
        this.setResolutionUniforms ? .(this.$el.offsetWidth, this.$el.offsetHeight)
    }

    ///////////////
    // Events
    ///////////////
    update(time, deltaTime, frame) {
        // Increment time
        this.time += 0.01

        // RAF uniforms
        if (this.material) {
            this.material.uniforms.uTime.value = this.time
        }
    }

    resize(width, height) {
        this.compute(width, height)
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
                uTime: { value: 0 },
                uResolution: { value: [0, 0] },
                uTexture: { value: null },
                uTextureResolution: { value: [0, 0] },
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
    setTexture(texture) {
        // Texture uniforms
        this.setTextureUniforms ? .(texture, 'uTexture')
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