import * as THREE from "three"
import { getTexture } from "../utils/webgl/getTexture"
import { openFileDialog } from "../utils/html";

import commonSceneMethods from "./mixins/commonSceneMethods"
import commonSceneUniforms from "./mixins/commonSceneUniforms"
import finalSceneAnimations from "./mixins/finalSceneAnimations"
import finalSceneHoldMethods from "./mixins/finalSceneHoldMethods"
import finalSceneUniforms from "./mixins/finalSceneUniforms"

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import Depthmap from "./scenes/Depthmap/Depthmap"
import Portal from "./scenes/Portal/Portal"
import Typo from "./scenes/Typo/Typo"
import fragment from "./shaders/fragment.glsl"
import vertex from "./shaders/vertex.glsl"
import { CookieManager, COOKIES_TYPE } from "../classes/Cookies/CookieManager";

/////////////////////////////////////////////
// Constants
/////////////////////////////////////////////
const DEFAULT_PORTAL_WIDTH = 259 // Based on mask texture
const HOLD_DURATION = 800

const EXPERIENCE_INSTANCES = [{
        id: 'portal',
        uniform: "uPortalTexture",
        class: Portal
    },
    {
        id: 'depthStart',
        uniform: "uDepthStartTexture",
        class: Depthmap
    },
    {
        id: 'depthEnd',
        uniform: "uDepthEndTexture",
        class: Depthmap
    },
    {
        id: 'typo',
        uniform: "uTypoTexture",
        class: Typo
    }
]

export default class Experiences {

    constructor({ $el, moduleInstance, images, paneObj }) {

        // Mixin commons scene methods
        Object.assign(this, commonSceneMethods)

        // Mixin commons uniforms
        Object.assign(this, commonSceneUniforms)

        // Mixin finale uniforms
        Object.assign(this, finalSceneUniforms)

        // Mixin finale hold methods
        Object.assign(this, finalSceneHoldMethods)

        // Mixin finale animations
        Object.assign(this, finalSceneAnimations)

        // DOM
        this.$el = $el

        // Data
        this.moduleInstance = moduleInstance
        this.images = images

        // Pane
        this.paneObj = paneObj;

        // Master animation data
        this.masterAnimationData = {
            progress: 0,
            target: 1,
            duration: 1.4
        }

        // Mask data
        this.maskData = {
            maxScale: 1
        }
        this.maskAnimationData = {
            progress: 0,
            value: 0,
        }

        // Noise data
        this.noiseAnimationData = {
            value: 1
        }

        // Hold data
        this.holdData = {
            holdDuration: HOLD_DURATION,
            baseTime: Date.now(),
            isHolding: false
        }
        this.holdAnimationData = {
            progress: 0,
            value: 0,
            targetIn: 0,
            targetOut: 0,
            durationIn: HOLD_DURATION / 1000,
            durationOut: .3,
            scaleMultiplier: 0.8
        };

        // hover
        this.hoverAnimationData = {
            progress: 0,
            durationIn: .6,
            durationOut: .6,
            allowed: !window.matchMedia('(hover: none)').matches
        };

        // Text data
        this.textAnimationData = {
            value: 1
        }

        // Depth End data
        this.depthScaleAnimationData = {
            scaleStart: 1.6,
            scaleEnd: 1,
            scaleValue: 1,
            scaleDuration: 1.6
        }

        this.depthScaleAnimationData.scaleValue = this.depthScaleAnimationData.scaleStart

        // Render Target Textures Instances
        this.rtTexturesInstances = []

        // All textures
        this.textures = {
            depthStartBackground: null,
            depthStartDepthmap: null
        }
        this.startTextureIndex = -1
        this.endTextureIndex = 0
        this.textIndex = -1
        this.allTextureLoaded = false

        // Hover
        this.isInteractiveAreaHovered = false

        // Flag
        this.isRevealed = false
        this.hasInteracted = false

        // Metrics
        this.width = $el.offsetWidth
        this.height = $el.offsetHeight
        this.dpr = window.devicePixelRatio
        this.normalizedDpr = Math.min(this.dpr, 2)

        // Render
        this.isRenderReady = false
        this.hasPostProcessing = this.normalizedDpr <= 1;

        // Prepare stuff
        this.createScene ? .()
        this.createCamera ? .()
        this.createRenderer()
        this.postProcess()

        // Init Canvas
        this.init()
    }

    ///////////////
    // Lifecycle
    ///////////////
    async init() {
        // Set main plane
        this.setPlane()

        // Init rtTextures instances
        EXPERIENCE_INSTANCES.forEach((experience) => {

            const experienceInstance = new experience.class({
                id: experience.id,
                    $el: this.$el,
                    moduleInstance: this.moduleInstance
            })

            // Store rtTextures instances
            this.rtTexturesInstances.push(experienceInstance)

            // Then update uniform to use it into the shaders
            this.setRTTextureUniforms ? .(experience.uniform, experienceInstance.rtTexture.texture)

        })

        if (this.paneObj) {
            this.setupPane();
        }
    }

    destroy() {
        this.rtTexturesInstances.forEach((rtTexturesInstance) => rtTexturesInstance ? .destroy ? .())
    }

    ///////////////
    // Loading
    ///////////////
    loadAssets() {
        const promises = []

        // Load Portal
        if (this.images ? .portalImage) {
            const portalPromise = this.loadPortalTexture(this.images.portalImage)
                .then((texture) => {
                    // set portal texture
                    this.setPortalTexture(texture)
                })

            promises.push(portalPromise)
        }

        // Load first depthmap
        if (this.images ? .depthImages ? .length) {
            const firstDepthPromise = this.loadFirstDepthMaps().then(() => {
                this.loadNextDepthMaps()
            })

            promises.push(firstDepthPromise)
        }

        // Load noise texture
        if (this.images ? .noiseImage) {
            const noisePromise = this.loadNoiseTexture(this.images.noiseImage)
                .then((texture) => {
                    // Set mask texture
                    this.setNoiseTexture(texture)
                })

            promises.push(noisePromise)
        }

        // Load mask texture
        if (this.images ? .maskImage) {
            const maskPromise = this.loadMaskTexture(this.images.maskImage)
                .then((texture) => {
                    // Set mask texture
                    this.setMaskTexture(texture)
                    this.maskTexture = texture
                })

            promises.push(maskPromise)
        }

        return Promise.all(promises).then(() => {
            this.onAssetsLoaded()
        })
    }

    onAssetsLoaded() {
        // Compute width
        this.width = this.$el.offsetWidth
        this.height = this.$el.offsetHeight

        // Compute values
        this.compute(this.width, this.height)

        // Experiences instances compute
        let rtTexturesInstancesIndex = 0
        while (rtTexturesInstancesIndex < this.rtTexturesInstances.length) {
            const rtTexturesInstance = this.rtTexturesInstances[rtTexturesInstancesIndex]
            rtTexturesInstance ? .compute ? .(this.width, this.height)
            rtTexturesInstancesIndex++
        }

        // Initial Uniforms
        this.setInitialUniforms ? .()

        // Set Tweens
        this.setTweens ? .()

        // Update
        this.isRenderReady = true

        // Hide Portal + Mask
        this.material.uniforms.uMaskProgress.value = 0

        requestAnimationFrame(() => {
            if (!window.isNotFirstLoading) {
                window.isNotFirstLoading = true
                    //this.moduleInstance.call('play', null, 'Introduction')
                this.revealExperience()
            } else {
                this.revealMin()
            }

            // if (!CookieManager.checkCookie(COOKIES_TYPE.SKIP_INTRO_COOKIE)) {
            //     //this.moduleInstance.call('play', null, 'Introduction')
            //     this.revealExperience()
            // } else {
            //     this.revealMin()
            // }
        })
    }

    ///////////////
    // Events
    ///////////////
    resize() {
        if (!this.isRenderReady) return

        // Compute width
        this.width = this.$el.offsetWidth
        this.height = this.$el.offsetHeight

        // Compute values
        this.compute(this.width, this.height)

        // Experiences instances resize
        let rtTexturesInstancesIndex = 0
        while (rtTexturesInstancesIndex < this.rtTexturesInstances.length) {
            const rtTexturesInstance = this.rtTexturesInstances[rtTexturesInstancesIndex]
            rtTexturesInstance ? .resize ? .(this.width, this.height)
            rtTexturesInstancesIndex++
        }
    }

    update(time, deltaTime, frame) {

        if (!this.isRenderReady) return

        // Update time uniform
        this.material.uniforms.uTime.value = time

        // Update hold status
        this.updateHold()

        // Render and update each scene
        let rtTexturesInstancesIndex = 0
        while (rtTexturesInstancesIndex < this.rtTexturesInstances.length) {
            // Update
            const rtTexturesInstance = this.rtTexturesInstances[rtTexturesInstancesIndex]
            rtTexturesInstance ? .update ? .(time, deltaTime, frame)
            rtTexturesInstancesIndex++

            // Render
            this.renderer.setRenderTarget(rtTexturesInstance.rtTexture);
            this.renderer.render(rtTexturesInstance.scene, rtTexturesInstance.camera);
            this.renderer.setRenderTarget(null);
        }

        // Render the final scene
        if (this.hasPostProcessing) {
            this.composer.render(this.scene, this.camera)
        } else {
            this.renderer.render(this.scene, this.camera)
        }
    }

    pointerDown() {
        this.pointerDownTime = Date.now()

        let rtTexturesInstancesIndex = 0
        while (rtTexturesInstancesIndex < this.rtTexturesInstances.length) {
            const rtTexturesInstance = this.rtTexturesInstances[rtTexturesInstancesIndex]
            rtTexturesInstance ? .pointerDown ? .()
            rtTexturesInstancesIndex++
        }

        this.holdDown()
    }

    pointerUp() {
        let rtTexturesInstancesIndex = 0
        while (rtTexturesInstancesIndex < this.rtTexturesInstances.length) {
            const rtTexturesInstance = this.rtTexturesInstances[rtTexturesInstancesIndex]
            rtTexturesInstance ? .pointerUp ? .()
            rtTexturesInstancesIndex++
        }

        this.holdUp()
    }

    mouseMove(mouseCoords) {
        let rtTexturesInstancesIndex = 0
        while (rtTexturesInstancesIndex < this.rtTexturesInstances.length) {
            const rtTexturesInstance = this.rtTexturesInstances[rtTexturesInstancesIndex]
            rtTexturesInstance ? .mouseMove ? .(mouseCoords)
            rtTexturesInstancesIndex++
        }
    }

    mouseEnter() {
        if (this.isInteractiveAreaHovered || !this.hoverAnimationData.allowed) return
        this.isInteractiveAreaHovered = true
        this.animateHoverEnter();
    }

    mouseLeave() {
        if (!this.isInteractiveAreaHovered || this.holdData.isHolding || !this.hoverAnimationData.allowed) return
        this.isInteractiveAreaHovered = false
        this.animateHoverLeave();
    }

    click() {
        if (this.moduleInstance.hasHoldAvailable) {
            this.diveAnimation();
        }
    }

    ///////////////
    // Three stuff
    ///////////////
    createRenderer() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true })
        this.renderer.setPixelRatio(this.normalizedDpr)
        this.renderer.setSize(this.width, this.height)
        this.renderer.setClearColor(0x000000, 1)

        // Push it into the DOM
        this.$el.appendChild(this.renderer.domElement)
    }

    postProcess() {
        const renderScene = new RenderPass(this.scene, this.camera);
        this.fxaaPass = new ShaderPass(FXAAShader);

        this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.width * this.normalizedDpr);
        this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.height * this.normalizedDpr);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.fxaaPass);
        this.composer.setPixelRatio(this.normalizedDpr)
        this.composer.setSize(this.width, this.height);
    }

    ///////////////
    // Plane
    ///////////////
    setPlane() {
        // Set rtTexturesUniforms
        const rtTexturesUniforms = {}
        EXPERIENCE_INSTANCES.forEach((experience) => {
            rtTexturesUniforms[experience.uniform] = { value: null }
        })

        // Set Material
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [0, 0] },
                uHasTextureSwapped: { value: false },

                uNoiseProgress: { value: 0 },
                uTextOpacityProgress: { value: 0 },

                uMaskProgress: { value: 0 },
                uMaskIdle: { value: 0 },
                uMaxMaskScale: { value: 0 },

                uMaskTexture: { value: null },
                uMaskTextureResolution: { value: [0, 0] },

                uNoiseTexture: { value: null },
                uNoiseTextureResolution: { value: [0, 0] },

                uDepthScale: { value: 1 },
                uDepthScaleStart: { value: 1 },

                uHoverProgress: { value: 0 },

                ...rtTexturesUniforms
            },
            // wireframe: true,
            // transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment
        })

        // Set Geometry
        const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

        // Create plane
        const plane = new THREE.Mesh(geometry, this.material)

        // Then add it to scene
        this.scene.add(plane)
    }

    /////////////////////////////////////////////
    // Portal Texture
    /////////////////////////////////////////////
    loadPortalTexture(src) {
        return getTexture(src).promise
    }

    setPortalTexture(texture) {
        const portalInstance = this.rtTexturesInstances.find(item => item.id === 'portal')
        portalInstance.setTexture(texture)
    }

    /////////////////////////////////////////////
    // Mask Texture
    /////////////////////////////////////////////
    loadMaskTexture(src) {
        return getTexture(src).promise
    }

    setMaskTexture(texture) {
        this.setTextureUniforms ? .(texture, 'uMaskTexture')
    }

    /////////////////////////////////////////////
    // Noise Texture
    /////////////////////////////////////////////
    loadNoiseTexture(src) {
        return getTexture(src).promise
    }

    setNoiseTexture(texture) {
        texture.wrapT = THREE.RepeatWrapping; // vertical wrapping
        texture.repeat.set(1, 1)
        this.setTextureUniforms ? .(texture, 'uNoiseTexture')
    }

    /////////////////////////////////////////////
    // Depth Textures
    /////////////////////////////////////////////
    loadFirstDepthMaps() {
        return new Promise((resolve) => {
            // Depthmap promises
            const depthmapTexturesPromises = []

            // Load 1st depthmap start
            if (this.images.depthImages[this.startTextureIndex]) {
                const depthStartTexturePromise = this.loadDepthStartTexture(this.images.depthImages[this.startTextureIndex].background, this.images.depthImages[this.startTextureIndex].depthmap)
                depthmapTexturesPromises.push(depthStartTexturePromise)
            }

            // Load 1st depthmap end
            if (this.images.depthImages[this.endTextureIndex]) {
                const depthEndTexturePromise = this.loadDepthEndTexture(this.images.depthImages[this.endTextureIndex].background, this.images.depthImages[this.endTextureIndex].depthmap)
                depthmapTexturesPromises.push(depthEndTexturePromise)
            }

            // Depthmap are ready
            Promise.all([...depthmapTexturesPromises]).then((values) => {

                // Set texture into their depthmap scene
                this.updateDepthTextures()

                // Resolve
                resolve()
            });
        })
    }

    loadNextDepthMaps() {
        if (!this.images ? .depthImages ? .length) return new Promise((resolve) => resolve())

        //!\\ Textures are already loaded when the master animation is complete
        ///// The this.textures object must contains the actual the next texture

        // Set texture index
        this.startTextureIndex = this.endTextureIndex
        this.endTextureIndex = (this.endTextureIndex + 1) % this.images.depthImages.length

        // Depthmap promises
        const depthmapTexturesPromises = []

        // Load 1st depthmap start
        if (this.images.depthImages[this.startTextureIndex]) {
            const depthStartTexturePromise = this.loadDepthStartTexture(this.images.depthImages[this.startTextureIndex].background, this.images.depthImages[this.startTextureIndex].depthmap)
            depthmapTexturesPromises.push(depthStartTexturePromise)
        }

        // Load 1st depthmap end
        if (this.images.depthImages[this.endTextureIndex]) {
            const depthEndTexturePromise = this.loadDepthEndTexture(this.images.depthImages[this.endTextureIndex].background, this.images.depthImages[this.endTextureIndex].depthmap)
            depthmapTexturesPromises.push(depthEndTexturePromise)
        }

        // Depthmap are ready
        return Promise.all([...depthmapTexturesPromises])
    }

    loadDepthStartTexture(backgroundSrc, depthmapSrc) {
        return new Promise(async(resolve) => {
            const backgroundTexture = await getTexture(backgroundSrc).promise;
            const depthmapTexture = await getTexture(depthmapSrc).promise;

            this.textures.depthStartBackground = backgroundTexture
            this.textures.depthStartDepthmap = depthmapTexture

            resolve([backgroundTexture, depthmapTexture])
        })
    }

    loadDepthEndTexture(backgroundSrc, depthmapSrc) {
        return new Promise(async(resolve) => {
            const backgroundTexture = await getTexture(backgroundSrc).promise;
            const depthmapTexture = await getTexture(depthmapSrc).promise;

            this.textures.depthEndBackground = backgroundTexture
            this.textures.depthEndDepthmap = depthmapTexture

            resolve([backgroundTexture, depthmapTexture])
        })
    }

    setDepthStartTexture() {
        const depthStartInstance = this.rtTexturesInstances.find(item => item.id === 'depthStart')
        depthStartInstance.setTextures(this.textures.depthStartBackground, this.textures.depthStartDepthmap)
    }

    setDepthEndTexture() {
        const depthEndInstance = this.rtTexturesInstances.find(item => item.id === 'depthEnd')
        depthEndInstance.setTextures(this.textures.depthEndBackground, this.textures.depthEndDepthmap)
    }

    updateDepthTextures() {
        this.textures.depthStartBackground && this.textures.depthStartDepthmap && this.setDepthStartTexture()
        this.textures.depthEndBackground && this.textures.depthEndDepthmap && this.setDepthEndTexture()
        this.material.uniforms.uHasTextureSwapped.value = true
    }

    ///////////////
    // Reset
    ///////////////
    reset() {
        // Compute mask max scale
        const maskTextureScale = this.computeMaskTextureScale(this.maskTexture)
        this.maskData.maxScale = this.setMaxMaskScaleUniforms ? .(maskTextureScale)

        // Update logo scale
        this.moduleInstance.call('updateScale', maskTextureScale, 'Logo')

        // Set interactive zone width
        this.setInteractiveAreaWidth(maskTextureScale)

        // Compute mask idle
        this.setMaskIdleUniforms ? .()

        // Set mask progress
        this.resetMaskAnimation()
        this.setMaskProgressUniforms ? .()

        // Set hold animation progress
        this.resetHoldAnimation()
    }

    resetMaskAnimation() {
        this.maskAnimationData.value = this.maskData.idle
    }

    resetHoldAnimation() {
        this.holdAnimationData.targetIn = this.maskData.idle * this.holdAnimationData.scaleMultiplier
        this.holdAnimationData.targetOut = this.maskData.idle
        this.holdAnimationData.value = this.maskData.idle
    }

    ///////////////
    // Methods
    ///////////////
    compute(width, height) {
        // Update resolution
        this.setResolutionUniforms ? .(width * this.normalizedDpr, height * this.normalizedDpr)

        // Reset uniforms
        this.reset()

        // Update renderer
        this.renderer.setSize(width, height)

        // Update camera
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        // Update FXAA shader
        this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.width * this.normalizedDpr);
        this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.height * this.normalizedDpr);
        this.composer.setPixelRatio(this.normalizedDpr)
        this.composer.setSize(this.width, this.height);
    }

    computeMaskTextureScale(maskTexture) {
        if (!maskTexture) return 1

        const canvasWidth = this.$el.offsetWidth
        const canvasHeight = this.$el.offsetHeight
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

    setInteractiveAreaWidth(textureScale) {
        const portalWidth = Math.round(DEFAULT_PORTAL_WIDTH * textureScale)
        const portalRadius = portalWidth * .5
        this.moduleInstance.$interactiveArea.style.width = `${portalWidth}px`
        this.moduleInstance.$interactiveArea.style.borderRadius = `${portalRadius}px ${portalRadius}px 0 0`
    }

    revealExperience() {
        this.revealFull()
    }

    // PANE
    //////////////////
    setupPane() {
        this.paneObj.pane.addInput(this, 'hasPostProcessing', {
            label: 'FXAA'
        })

        const dataFolder = this.paneObj.pane.addFolder({
            title: "Import/Export",
            expanded: false
        })

        dataFolder.addButton({
            title: "Import"
        }).on('click', () => {
            openFileDialog('.json,application/json', e => {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    const result = JSON.parse(event.currentTarget.result)
                    this.paneObj.pane.importPreset(result)
                });
                reader.readAsText(e.target.files[0]);
            })
        })

        dataFolder.addButton({
            title: "Export"
        }).on('click', () => {
            const preset = JSON.stringify(this.paneObj.pane.exportPreset());

            const hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:application/json,' + encodeURI(preset);
            hiddenElement.target = '_blank';
            hiddenElement.download = `preset_${Date.now()}.json`;
            hiddenElement.click();
        })
    }
}