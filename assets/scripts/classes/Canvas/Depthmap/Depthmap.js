import * as THREE from "three"
import { getTexture } from "../../../utils/webgl/getTexture"
import fragment from "./shaders/fragment.glsl"
import vertex from "./shaders/vertex.glsl"
import * as TweakpaneImagePlugin from 'tweakpane-image-plugin';

export default class Depthmap {
    constructor({ scene, renderer, paneObj, moduleInstance }) {
        // Args
        this.scene = scene
        this.renderer = renderer
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance

        // Data
        this.time = 0

        // Images
        this.textures = [];

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

        this.originalTextureSrc = '/assets/images/temp/texture1.jpg';
        this.depthTextureSrc = '/assets/images/temp/texture1-map.jpg'
        this.originalTexture = await getTexture(this.originalTextureSrc).promise;
        this.depthTexture = await getTexture(this.depthTextureSrc).promise;

        this.setResolutionUniforms()
        this.setOriginalTextureUniforms()
        this.setDepthTextureUniforms()

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

        // RAF uniforms
        this.material.uniforms.uTime.value = this.time
    }

    pointerDown() {
        console.log(`${this.moduleInstance.playgroundId}: pointerDown`)
    }

    pointerUp() {
        console.log(`${this.moduleInstance.playgroundId}: pointerUp`)
    }

    mouseMove(mouseCoords) {
        let { x, y, smoothX, smoothY } = mouseCoords

        const halfX = this.material.uniforms.uResolution.value[0] / 2
        const halfY = this.material.uniforms.uResolution.value[1] / 2

        // Convert to shader coords
        x = (halfX - x) / halfX
        y = (halfY - y) / halfY
            // console.log(`${this.moduleInstance.playgroundId}: mouseMove`, mouseCoords)
        this.material.uniforms.uMouse.value = [x, y]
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

                uMouse: { value: [0, 0] },
                uThreshold: { value: [40, 60] },

                uResolution: { value: [0, 0] },
                uPixelRatio: this.dpr,
                uOriginalTexture: { value: null },
                uOriginalTextureResolution: { value: [0, 0] },
                uDepthTexture: { value: null },
                uDepthTextureResolution: { value: [0, 0] }
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

    setOriginalTextureUniforms() {
        this.material.uniforms.uOriginalTexture.value = this.originalTexture
        this.material.uniforms.uOriginalTextureResolution.value = [this.originalTexture.image.width, this.originalTexture.image.height]
    }

    setDepthTextureUniforms() {
        this.material.uniforms.uDepthTexture.value = this.depthTexture
        this.material.uniforms.uDepthTextureResolution.value = [this.depthTexture.image.width, this.depthTexture.image.height]
    }

    ///////////////
    // PANE
    ///////////////
    setupPane() {
        if (!this.paneObj) return

        this.paneObj.pane.registerPlugin(TweakpaneImagePlugin);

        // Create folder
        const folder = this.paneObj.pane.addFolder({
            title: 'Depthmap',
            expanded: true
        });

        // Image
        this.paneObj.params.image = new Image();
        this.paneObj.params.image.src = this.originalTextureSrc;
        folder.addInput(this.paneObj.params, 'image', {
            view: 'input-image'
        }).on('change', async(ev) => {
            this.originalTextureSrc = ev.value.currentSrc;
            this.originalTexture = await getTexture(this.originalTextureSrc).promise;
            this.setOriginalTextureUniforms()
        })

        // Depthmap
        this.paneObj.params.depthMap = new Image();
        this.paneObj.params.depthMap.src = this.depthTextureSrc;
        folder.addInput(this.paneObj.params, 'depthMap', {
            view: 'input-image'
        }).on('change', async(ev) => {
            this.depthTextureSrc = ev.value.currentSrc
            this.depthTexture = await getTexture(this.depthTextureSrc).promise;
            this.setDepthTextureUniforms()
        })

        // Threshold
        this.paneObj.params.threshold = { x: this.material.uniforms.uThreshold.value[0], y: this.material.uniforms.uThreshold.value[1] };
        folder
            .addInput(this.paneObj.params, 'threshold', {
                x: { min: 0, max: 100 },
                y: { min: 0, max: 100, inverted: true }
            })
            .on('change', (ev) => {
                const value = ev.value
                this.material.uniforms.uThreshold.value[0] = value.x
                this.material.uniforms.uThreshold.value[1] = value.y
            });
    }
}