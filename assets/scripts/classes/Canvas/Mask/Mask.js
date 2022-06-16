import { clamp, gsap, mapRange } from 'gsap/all'
import * as THREE from "three"
import { getTexture } from "../../../utils/webgl/getTexture"
import fragment from "./shaders/fragment.glsl"
import vertex from "./shaders/vertex.glsl"
import bezier from 'bezier-easing';

/////////////////////////////////////////////
// Constants
///////////////////////////////////////////// 
const DEFAULT_PORTAL_CIRCLE_WIDTH = 288 // Based on mask texture
const DEFAULT_PORTAL_WIDTH = 259 // Based on mask texture
const HOLD_DURATION = 1000

const SMOOTH_EASING = bezier(0.38, 0.005, 0.215, 1)
const POWER1_OUT = bezier(0.250, 0.460, 0.450, 0.940);
const POWER2_OUT = bezier(0.215, 0.610, 0.355, 1.000);
const POWER3_OUT = bezier(0.165, 0.840, 0.440, 1.000);
const POWER4_OUT = bezier(0.230, 1.000, 0.320, 1.000);
const POWER1_IN = bezier(0.550, 0.085, 0.680, 0.530);
const POWER2_IN = bezier(0.550, 0.055, 0.675, 0.190);
const POWER3_IN = bezier(0.895, 0.030, 0.685, 0.220);
const POWER4_IN = bezier(0.755, 0.050, 0.855, 0.060);
const LINEAR = bezier(0, 0, 1, 1);

/////////////////////////////////////////////
// Class
/////////////////////////////////////////////
export default class Mask {
    constructor({ scene, renderer, paneObj, moduleInstance }) {
        // Args
        this.scene = scene
        this.renderer = renderer
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance

        // Data
        this.time = 0

        // Global animation data
        this.globalAnimationData = {
            progress: 0,
            target: 1,
            duration: 1.4
        }

        // Mask data
        this.maskData = {
            idle: .5,
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

        // Opacity data
        this.opacityAnimationData = {
            progress: 0,
            value: 0,
            durationIn: .6,
            durationOut: .6
        };

        // Texture index
        this.textures = []
        this.startTextureIndex = null
        this.endTextureIndex = -1

        // Hover
        this.isInteractiveAreaHovered = false

        // Init
        this.init()
    }

    /////////////////////////////////////////////
    // Lifecycle
    ///////////////////////////////////////////// 
    async init() {
        // Setup pane
        this.setupPane()

        // Set plane
        this.setPlane()

        // TODO: REFACTO
        const startTexture = await getTexture('/assets/images/temp/texture0.jpg').promise;
        this.textures.push(startTexture)

        const endTexture = await getTexture('/assets/images/temp/texture1.jpg').promise;
        this.textures.push(endTexture)

        this.setTextures()

        // Normal map texture
        this.nrmTexture = await getTexture('/assets/images/temp/normalMap.jpg').promise;
        //this.nrmTexture.wrapS = THREE.RepeatWrapping; // horizontal wrapping
        this.nrmTexture.wrapT = THREE.RepeatWrapping; // vertical wrapping
        this.nrmTexture.repeat.set(1, 1);
        this.setNrmTextureUniforms()

        // Mask texture
        this.maskTexture = await getTexture('/assets/images/temp/mask.jpg').promise;
        this.setMaskTextureUniforms()

        // Noise
        this.setNoiseUniforms()

        // Opacity
        this.setOpacityProgressUniforms()

        // Reset uniforms
        this.resetDefaultUniforms()
    }

    destroy() {
        console.log("Mask: destroy")
    }

    /////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////
    resize() {
        // Update resolution
        this.setResolutionUniforms()
            // Reset uniforms
        this.resetDefaultUniforms()
    }

    update(time, deltaTime, frame) {
        // Increment time
        this.time += 0.01

        // Update uniforms
        this.setTimeUniforms()

        // Update hold status
        this.updateHold()
    }

    pointerDown() {
        this.holdDown()
    }

    pointerUp() {
        this.holdUp()
    }

    mouseEnter() {
        if (this.isInteractiveAreaHovered) return
        this.isInteractiveAreaHovered = true
        this.animateOpacityIn()
    }

    mouseLeave() {
        if (!this.isInteractiveAreaHovered || this.holdData.isHolding) return
        this.isInteractiveAreaHovered = false
        this.animateOpacityOut()
    }

    /////////////////////////////////////////////
    // Methods
    /////////////////////////////////////////////
    setPlane() {
        // Set Material
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [0, 0] },

                uMaskProgress: { value: 0 },
                uMaskIdle: { value: 0 },
                uMaxMaskScale: { value: 0 },

                uNoiseProgress: { value: 0 },

                uOpacityProgress: { value: 0 },

                uStartTexture: { value: null },
                uStartTextureResolution: { value: [0, 0] },

                uEndTexture: { value: null },
                uEndTextureResolution: { value: [0, 0] },

                uMaskTexture: { value: null },
                uMaskTextureResolution: { value: [0, 0] },

                uNrmTexture: { value: null },
                uNrmTextureResolution: { value: [0, 0] },
            },
            transparent: true,
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

    setTextures() {
        // Set texture index 
        this.startTextureIndex = this.endTextureIndex
        this.endTextureIndex = (this.endTextureIndex + 1) % this.textures.length

        // Update textures
        this.setStartTextureUniforms()
        this.setEndTextureUniforms()
    }

    setInteractiveAreaWidth(textureScale) {
        const portalWidth = Math.round(DEFAULT_PORTAL_WIDTH * textureScale)
        const portalRadius = portalWidth * .5
        this.moduleInstance.$interactiveArea.style.width = `${portalWidth}px`
        this.moduleInstance.$interactiveArea.style.borderRadius = `${portalRadius}px ${portalRadius}px 0 0`
    }

    /////////////////////////////////////////////
    // Hold
    /////////////////////////////////////////////
    holdDown() {
        if (this.holdData.isHolding || !this.moduleInstance.hasHoldAvailable) return
            // Reset base time
        this.holdData.baseTime = Date.now()
            // Set flag
        this.holdData.isHolding = true
            // Start cursor animation
        this.moduleInstance.call('holdDown', HOLD_DURATION, 'Cursor')
            // Animate opacity
        if (!this.isInteractiveAreaHovered) {
            this.animateOpacityIn()
        }
        // Animate gl hold
        this.animateHoldDown()
    }

    holdUp(isComplete = false) {
        if (!this.holdData.isHolding || !this.moduleInstance.hasHoldAvailable) return
            // Set flag
        this.holdData.isHolding = false
            // Stop cursor animation
        this.moduleInstance.call('holdUp', HOLD_DURATION, 'Cursor')
            // Animate gl hold
        if (!isComplete) {
            if (!this.isInteractiveAreaHovered) {
                this.animateOpacityOut()
            }

            this.animateHoldUp()
        }
    }

    updateHold() {
        if (!this.holdData.isHolding) return

        const dateNow = Date.now()
        const elapsedTime = dateNow - this.holdData.baseTime

        // If minimum duration passed
        if (elapsedTime > HOLD_DURATION) {
            this.holdUp(true)
            this.animateGlobal()
        }
    }

    /////////////////////////////////////////////
    // Uniforms
    /////////////////////////////////////////////
    resetDefaultUniforms() {
        this.setMaxMaskScaleUniforms()
        this.setMaskIdleUniforms()
    }

    setMaskTextureUniforms() {
        const texWidth = this.maskTexture.image.width
        const texHeight = this.maskTexture.image.height
        this.material.uniforms.uMaskTexture.value = this.maskTexture
        this.material.uniforms.uMaskTextureResolution.value = [texWidth, texHeight]
    }

    setNrmTextureUniforms() {
        const texWidth = this.nrmTexture.image.width
        const texHeight = this.nrmTexture.image.height
        this.material.uniforms.uNrmTexture.value = this.nrmTexture
        this.material.uniforms.uNrmTextureResolution.value = [texWidth, texHeight]
    }

    setStartTextureUniforms() {
        const startTexture = this.textures[this.startTextureIndex]

        if (!startTexture) return

        const texWidth = startTexture.image.width
        const texHeight = startTexture.image.height
        this.material.uniforms.uStartTexture.value = startTexture
        this.material.uniforms.uStartTextureResolution.value = [texWidth, texHeight]
    }

    setEndTextureUniforms() {
        const endTexture = this.textures[this.endTextureIndex]

        if (!endTexture) return

        const texWidth = endTexture.image.width
        const texHeight = endTexture.image.height
        this.material.uniforms.uEndTexture.value = endTexture
        this.material.uniforms.uEndTextureResolution.value = [texWidth, texHeight]
    }

    setResolutionUniforms() {
        const canvasWidth = this.renderer.domElement.offsetWidth
        const canvasHeight = this.renderer.domElement.offsetHeight
        this.material.uniforms.uResolution.value = [canvasWidth, canvasHeight]
    }

    setTimeUniforms() {
        this.material.uniforms.uTime.value = this.time
    }

    setMaxMaskScaleUniforms() {
        // 1. Get texture scale (values based on background UV)
        const canvasWidth = this.renderer.domElement.offsetWidth
        const canvasHeight = this.renderer.domElement.offsetHeight
        const originalTexWidth = this.maskTexture.image.width
        const originalTexHeight = this.maskTexture.image.height

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

        const textureScale = currentTexWidth / originalTexWidth
        const circleWidth = DEFAULT_PORTAL_CIRCLE_WIDTH * textureScale

        // Set interactive zone width
        this.setInteractiveAreaWidth(textureScale)

        // 2. Get mask original scale (use pythagore to cover a maximum of possibilities)
        const pythA = canvasHeight / 2
        const pythB = canvasWidth / 2
        const hypot = Math.hypot(pythA, pythB)

        // 3. Result
        const originalScale = (hypot / circleWidth) * 2
        const roundedScale = Math.round((originalScale + Number.EPSILON) * 100) / 100

        this.maskData.maxScale = this.material.uniforms.uMaxMaskScale.value = roundedScale
    }

    setMaskProgressUniforms() {
        this.material.uniforms.uMaskProgress.value = this.maskAnimationData.value
    }

    setOpacityProgressUniforms() {
        this.material.uniforms.uOpacityProgress.value = this.opacityAnimationData.value
    }

    setMaskIdleUniforms() {
        const idle = Math.round((1 / this.maskData.maxScale + Number.EPSILON) * 100) / 100
        this.maskData.idle = this.material.uniforms.uMaskIdle.value = idle

        // Set mask progress
        this.maskAnimationData.value = this.maskData.idle
        this.setMaskProgressUniforms()

        // Set hold animation progress 
        this.holdAnimationData.targetIn = this.maskData.idle * this.holdAnimationData.scaleMultiplier
        this.holdAnimationData.targetOut = this.maskData.idle
        this.holdAnimationData.value = this.maskData.idle
    }

    setNoiseUniforms() {
        this.material.uniforms.uNoiseProgress.value = this.noiseAnimationData.value
    }

    /////////////////////////////////////////////
    // PANE
    /////////////////////////////////////////////
    setupPane() {
        if (!this.paneObj) return

        // Create folder
        const folder = this.paneObj.pane.addFolder({
            title: 'Mask',
            expanded: true
        });

        // Progress
        this.paneObj.params.progress = 0
        folder
            .addInput(this.paneObj.params, 'progress', { min: 0, max: 1 })
            .on('change', (ev) => {
                const value = ev.value
                this.material.uniforms.uMaskProgress.value = value
            });
    }

    /////////////////////////////////////////////
    // Animation
    ///////////////////////////////////////////

    ///////////////
    // Global
    animateGlobal() {
        // Disable interactivity
        this.moduleInstance.hasHoldAvailable = false

        // Set mask animation
        this.setMaskAnimation()
        this.setNoiseAnimation()

        //requestAnimationFrame(() => {
        //this.globalTween?.kill()

        this.holdTween = gsap.to(this.globalAnimationData, {
                duration: this.globalAnimationData.duration,
                progress: this.globalAnimationData.target,
                ease: 'linear',
                onUpdate: () => {
                    // Subscribe to global animation
                    this.animateMask(this.globalAnimationData.progress)
                },
                onComplete: this.resetGlobal.bind(this)
            })
            //})
    }

    resetGlobal() {
        // Reset progress
        this.globalAnimationData.progress = 0
        this.holdAnimationData.value = this.maskData.idle
        this.holdAnimationData.progress = 0
        this.maskAnimationData.value = this.maskData.idle
        this.maskAnimationData.progress = 0
        this.noiseAnimationData.value = 0

        // Enable interactivity
        this.moduleInstance.hasHoldAvailable = true
    }

    ///////////////
    // Mask
    setMaskAnimation() {
        let hasChangeTexture = false

        this.portalTween = gsap.to(this.maskAnimationData, {
            progress: 1,
            ease: 'linear',
            onUpdate: () => {

                // Compute value
                const valueStart = this.holdAnimationData.targetIn
                const valueEnd = 1 + this.maskData.idle
                const easedValue = mapRange(0, 1, valueStart, valueEnd, POWER2_OUT(this.maskAnimationData.progress))

                // Compute mask progress
                const computedValue = (easedValue + 1) % 1
                this.material.uniforms.uMaskProgress.value = computedValue

                // Animate with mask in progress
                const maskOutProgress = clamp(0, 1, mapRange(this.maskData.idle, 1, 0, 1, easedValue))
                if (maskOutProgress > 0 && maskOutProgress < 1) {
                    this.animateMaskOut(maskOutProgress)
                }

                // Animate with mask out progress
                const maskInProgress = clamp(0, 1, mapRange(1, 1 + this.maskData.idle, 0, 1, easedValue))
                if (maskInProgress > 0 && maskInProgress < 1) {
                    this.animateMaskIn(maskInProgress)
                }

                // Change texture
                if (easedValue >= 1 && !hasChangeTexture) {
                    // texture flag
                    hasChangeTexture = true
                        // change texture
                    this.setTextures()
                        // hide new texture 
                    if (!this.isInteractiveAreaHovered) {
                        this.material.uniforms.uOpacityProgress.value = 0
                        this.opacityAnimationData.progress = 0
                        this.opacityAnimationData.value = 0
                    }
                }
            },
            paused: true,
            immediateRender: false
        })
    }

    // Subscribe to the duration of the entire mask animation
    animateMask(progress) {
        this.portalTween ? .progress(progress)
    }

    // Subscribe from the start to the idle
    animateMaskIn(progress) {
        this.noiseAppearTween ? .progress(progress)
    }

    // Subscribe from the idle to the end
    animateMaskOut(progress) {
        this.noiseDisappearTween ? .progress(progress)
    }

    ///////////////
    // Noise
    setNoiseAnimation() {
        this.noiseDisappearTween = gsap.fromTo(this.noiseAnimationData, {
            value: 1
        }, {
            value: 0,
            ease: 'linear',
            onUpdate: () => {
                this.material.uniforms.uNoiseProgress.value = this.noiseAnimationData.value
            },
            paused: true,
            immediateRender: false
        })

        this.noiseAppearTween = gsap.fromTo(this.noiseAnimationData, {
            value: 0
        }, {
            value: 1,
            ease: 'linear',
            onUpdate: () => {
                this.material.uniforms.uNoiseProgress.value = this.noiseAnimationData.value
            },
            paused: true,
            immediateRender: false
        })
    }

    ///////////////
    // Hold
    animateHoldDown() {
        this.holdTween ? .kill()

        const valueStart = this.holdAnimationData.value

        this.holdTween = gsap.to(this.holdAnimationData, {
            duration: this.holdAnimationData.durationIn,
            progress: 1,
            ease: 'linear',
            onUpdate: () => {
                // Compute value
                const valueEnd = this.holdAnimationData.targetIn
                const easedValue = mapRange(0, 1, valueStart, valueEnd, SMOOTH_EASING(this.holdAnimationData.progress))

                this.material.uniforms.uMaskProgress.value = easedValue
                this.holdAnimationData.value = easedValue
            }
        })
    }

    animateHoldUp() {
        this.holdTween ? .kill()

        const valueStart = this.holdAnimationData.value

        this.holdTween = gsap.to(this.holdAnimationData, {
            duration: this.holdAnimationData.durationOut,
            progress: 0,
            ease: 'linear',
            onUpdate: () => {
                // Compute value
                const valueEnd = this.holdAnimationData.targetOut
                const easedValue = mapRange(1, 0, valueStart, valueEnd, POWER2_OUT(this.holdAnimationData.progress))

                this.material.uniforms.uMaskProgress.value = easedValue
                this.holdAnimationData.value = easedValue

            }
        })
    }

    ///////////////
    // Opacity
    animateOpacityIn() {

        if (this.opacityAnimationData.isAnimatedIn) return

        this.opacityTween ? .kill()
        this.opacityAnimationData.isAnimatedOut = false

        this.opacityTween = gsap.to(this.opacityAnimationData, {
            duration: this.opacityAnimationData.durationIn,
            progress: 1,
            ease: 'linear',

            onStart: () => {
                this.opacityAnimationData.isAnimatedIn = true
            },

            onUpdate: () => {
                // Compute value
                const easedValue = mapRange(0, 1, 0, 1, POWER1_OUT(this.opacityAnimationData.progress))

                this.material.uniforms.uOpacityProgress.value = easedValue
                this.opacityAnimationData.value = easedValue
            },

            onComplete: () => {
                this.opacityAnimationData.isAnimatedIn = false
            }
        })
    }

    animateOpacityOut() {

        if (this.opacityAnimationData.isAnimatedOut) return

        this.opacityTween ? .kill()
        this.opacityAnimationData.isAnimatedIn = false

        this.opacityTween = gsap.to(this.opacityAnimationData, {
            duration: this.opacityAnimationData.durationOut,
            progress: 0,
            ease: 'linear',

            onStart: () => {
                this.opacityAnimationData.isAnimatedOut = true
            },

            onUpdate: () => {
                // Compute value
                const easedValue = mapRange(0, 1, 0, 1, POWER1_IN(this.opacityAnimationData.progress))

                this.material.uniforms.uOpacityProgress.value = easedValue
                this.opacityAnimationData.value = easedValue
            },

            onComplete: () => {
                this.opacityAnimationData.isAnimatedOut = false
            }
        })
    }
}