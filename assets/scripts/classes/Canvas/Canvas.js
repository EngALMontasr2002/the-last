import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import playgroundInstances from "./playgroundInstances"


export default class Canvas {

    constructor({ $el, playgroundId, paneObj, moduleInstance, hasBloomPass }) {
        // DOM
        this.$el = $el

        // Data
        this.playgroundId = playgroundId
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance
        this.hasBloomPass = hasBloomPass

        // Metrics
        this.width = $el.offsetWidth
        this.height = $el.offsetHeight
        this.dpr = window.devicePixelRatio

        // Prepare stuff
        this.createScene()
        this.createCamera()
        this.createRenderer()
        this.createBloomPass()

        // Init Canvas
        this.init()
    }

    ///////////////
    // Lifecycle
    ///////////////
    init() {
        // Set orbit controls
        //this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        // Playground instance
        const playgroundClass = playgroundInstances[this.playgroundId]
        this.playgroundInstance = new playgroundClass({
            scene: this.scene,
            renderer: this.renderer,
            paneObj: this.paneObj,
            moduleInstance: this.moduleInstance
        })
    }

    destroy() {
        this.playgroundInstance ? .destroy ? .()
    }

    ///////////////
    // Events
    ///////////////
    resize() {
        // Compute width
        this.width = this.$el.offsetWidth
        this.height = this.$el.offsetHeight

        // Update renderer
        this.renderer.setSize(this.width, this.height)

        // Update renderer        
        if (this.hasBloomPass) {
            this.composer.setSize(this.width, this.height);
        }

        // Update camera
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()

        // Launch playgroundInstance resize
        this.playgroundInstance ? .resize ? .()
    }

    update(time, deltaTime, frame) {
        // Launch canvas update
        this.playgroundInstance ? .update ? .(time, deltaTime, frame)

        // Render
        if (this.hasBloomPass) {
            this.composer.render(this.scene, this.camera);
        } else {
            this.renderer.render(this.scene, this.camera)
        }
    }

    pointerDown() {
        // Launch canvas event
        this.playgroundInstance ? .pointerDown ? .()
    }

    pointerUp() {
        // Launch canvas event
        this.playgroundInstance ? .pointerUp ? .()
    }

    mouseMove(mouseCoords) {
        // Launch canvas event
        this.playgroundInstance ? .mouseMove ? .(mouseCoords)
    }


    ///////////////
    // Methods
    ///////////////

    // Scene
    createScene() {
        this.scene = new THREE.Scene()
    }

    // Camera
    createCamera() {
        const frustumSize = 1
        let aspect = 1
        if (this.playgroundId == 'TYPO') aspect = window.innerWidth / window.innerHeight
        this.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, -1000, 1000)
        this.camera.position.set(0, 0, 2)
    }

    // Renderer
    createRenderer() {
        const normalizedDpr = Math.min(this.dpr, 2)

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(normalizedDpr)
        this.renderer.setSize(this.width, this.height)
        this.renderer.setClearColor(0x000000, 1)

        // Push it into the DOM
        this.$el.appendChild(this.renderer.domElement)
    }

    createBloomPass() {
        const normalizedDpr = Math.min(this.dpr, 2)

        const params = {
            exposure: 1,
            bloomStrength: 0.6,
            bloomThreshold: 0.99,
            bloomRadius: 0.6
        };

        const renderScene = new RenderPass(this.scene, this.camera);

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), params.bloomStrength, params.bloomRadius, params.bloomThreshold);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
        this.composer.setPixelRatio(normalizedDpr)
        this.composer.setSize(this.width, this.height);
    }
}