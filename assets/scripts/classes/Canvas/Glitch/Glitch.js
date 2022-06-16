import * as THREE from "three"
import { gsap } from 'gsap/all'
import { getTexture } from "../../../utils/webgl/getTexture"
import fragment from "./shaders/fragment.glsl"
import vertex from "./shaders/vertex.glsl"

export default class Glitch {
    constructor({ scene, renderer, paneObj, moduleInstance }) {
        // Args
        this.scene = scene
        this.renderer = renderer
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance

        // Data
        this.time = 0

        // Init
        this.init()
    }

    ///////////////
    // Lifecycle
    ///////////////
    async init() {
        console.log(`${this.moduleInstance.playgroundId}: init`)

        // Set plane
        this.setPlane()

        this.video = document.createElement('video');
        this.video.muted = true;
        this.video.autoplay = true;
        this.video.src = '/assets/images/temp/samplevideo.mp4'
        document.body.appendChild(this.video)
        gsap.set(this.video, { position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10, opacity: 0, pointerEvents: 'none' })

        this.videoTexture = await getTexture(this.video);
        this.setVideoTextureUniforms()

        // Setup pane
        this.setupPane()
    }

    destroy() {
        console.log(`${this.moduleInstance.playgroundId}: destroy`)
    }

    ///////////////
    // Events
    ///////////////
    resize() {
        console.log(`${this.moduleInstance.playgroundId}: resize`)
            // Update resolution
        this.setResolutionUniforms()
    }

    update(time, deltaTime, frame) {
        // Increment time
        this.time += 0.01

        // Update uniforms
        this.setTimeUniforms();

        this.videoTexture.needsUpdate = true;
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

                uResolution: { value: [0, 0] },
                uPixelRatio: this.dpr,

                uVideoTexture: { value: null },
                uVideoTextureResolution: { value: [0, 0] },
            },
            // wireframe: true,
            // transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment
        })

        // Set Geometry
        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

        // Create plane
        this.plane = new THREE.Mesh(this.geometry, this.material)

        // Then add it to scene
        this.scene.add(this.plane)
    }

    ///////////////
    // UNIFORMS
    ///////////////
    setResolutionUniforms() {
        const canvasWidth = this.renderer.domElement.offsetWidth
        const canvasHeight = this.renderer.domElement.offsetHeight
        this.material.uniforms.uResolution.value = [canvasWidth, canvasHeight]
    }

    setTimeUniforms() {
        this.material.uniforms.uTime.value = this.time
    }

    setVideoTextureUniforms() {
        this.material.uniforms.uVideoTexture.value = this.videoTexture
        this.material.uniforms.uVideoTextureResolution.value = [this.videoTexture.image.width, this.videoTexture.image.height]
    }

    ///////////////
    // PANE
    ///////////////
    setupPane() {
        if (!this.paneObj) return

        // Create folder
        const folder = this.paneObj.pane.addFolder({
            title: this.moduleInstance.playgroundId,
            expanded: true
        });
    }
}