import bezier from "bezier-easing";
import gsap, { clamp, mapRange } from "gsap/all"
import { html } from "../../utils/environment";

const SMOOTH_EASING = bezier(0.38, 0.005, 0.215, 1)
const POWER2_OUT = bezier(0.215, 0.610, 0.355, 1.000);

export default finalSceneAnimations = {

    ///////////////
    // Settings
    setTweens() {
        // Set animations
        this.setMasterAnimation()
        this.setMaskAnimation()
        this.setNoiseAnimation()
        this.setTextAnimation()
    },

    resetTweensData() {
        // Master
        this.masterAnimationData.progress = 0

        // Hold
        this.holdAnimationData.value = this.maskData.idle
        this.holdAnimationData.progress = 0

        // Mask
        this.maskAnimationData.value = this.maskData.idle
        this.maskAnimationData.progress = 0

        // Noise
        this.noiseAnimationData.value = 0
    },

    ///////////////
    // Master
    setMasterAnimation() {
        this.masterTween = gsap.to(this.masterAnimationData, {
            duration: this.masterAnimationData.duration,
            progress: this.masterAnimationData.target,
            ease: 'linear',
            onUpdate: () => {
                this.onMasterAnimating(this.masterAnimationData.progress)
            },
            onComplete: this.completeMasterAnimation.bind(this),
            paused: true,
            immediateRender: false
        })
    },

    startMasterAnimation() {
        return new Promise((resolve) => {
            // Disable interactivity
            this.moduleInstance.hasHoldAvailable = false

            // Play master
            this.masterTween.restart().then(() => {
                resolve()
            })

            // Play depth end scale
            this.animateDepthEndScale()

            // Has interacted : Hide "click and hold" hint
            // if (!this.hasInteracted) {
            //     html.classList.add('has-interacted')
            //     this.hasInteracted = true
            // }

            // Remove prev link cta class
            let index = 0
            while (index < this.moduleInstance.$navItems.length) {
                this.moduleInstance.$navItems[index].classList.remove('is-active')
                index++
            }
        })
    },

    completeMasterAnimation() {
        this.textIndex++;
        if (this.textIndex >= this.moduleInstance.$navItems.length) {
            this.textIndex = 0
        }

        if (typeof this.moduleInstance.$navItems[this.textIndex] !== 'undefined') {
            this.moduleInstance.$navItems[this.textIndex].classList.add('is-active')
        }

        // Reset tween data
        this.resetTweensData()

        // Reveal text
        this.revealText(this.textIndex)

        // Load next depth map
        this.loadNextDepthMaps().then(() => {
            // Enable interactivity
            this.moduleInstance.hasHoldAvailable = true
                // Show link
        })
    },

    // Subscribe to the master animation
    onMasterAnimating(progress) {
        this.onMaskAnimating(progress)
    },

    ///////////////
    // Mask
    setMaskAnimation() {
        this.maskTween = gsap.to(this.maskAnimationData, {
            progress: 1,
            ease: 'linear',
            onStart: () => {
                this.hasChangeDepthTexture = false

                this.tdateNow = Date.now()
            },
            onComplete: () => {
                this.hasChangeDepthTexture = false
            },
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
                    this.onMaskAnimatingOut(maskOutProgress)
                }

                // Animate with mask out progress
                const maskInProgress = clamp(0, 1, mapRange(1, 1 + this.maskData.idle, 0, 1, easedValue))
                if (maskInProgress > 0 && maskInProgress < 1) {
                    this.onMaskAnimatingIn(maskInProgress)
                }

                // Change depth texture
                if (easedValue >= 1 && !this.hasChangeDepthTexture) {
                    // texture flag
                    this.hasChangeDepthTexture = true

                    // change texture
                    this.updateDepthTextures ? .()

                    // Show link cta
                    // this.moduleInstance.$navItems[this.startTextureIndex].classList.add('is-active')
                }
            },
            paused: true,
            immediateRender: false
        })
    },

    // Subscribe to the duration of the entire mask animation
    onMaskAnimating(progress) {
        this.maskTween.progress(progress)
    },

    // Subscribe from the start to the idle
    onMaskAnimatingIn(progress) {
        this.noiseAppearTween.progress(progress)
    },

    // Subscribe from the idle to the end
    onMaskAnimatingOut(progress) {
        this.noiseDisappearTween.progress(progress)
    },

    ///////////////
    // Hold
    animateHoldDown(callback = () => {}) {
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

                // Animate with hold down progress
                this.onHoldDownAnimating(this.holdAnimationData.progress)

                // Animate mask progress
                this.material.uniforms.uMaskProgress.value = easedValue

                // Set current easedValue
                this.holdAnimationData.value = easedValue
            },
            onComplete: callback
        })
    },

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

                // Animate with hold up progress
                this.onHoldUpAnimating(this.holdAnimationData.progress)

                // Animate mask progress
                this.material.uniforms.uMaskProgress.value = easedValue

                // Set current easedValue
                this.holdAnimationData.value = easedValue
            }
        })
    },

    // Subscribe from the hold down animation
    onHoldDownAnimating(progress) {
        // Text progress
        const textProgress = SMOOTH_EASING(progress)
        this.textDisappearTween.progress(textProgress)
    },

    // Subscribe from the hold up animation
    onHoldUpAnimating(progress) {
        // Text progress
        const textProgress = mapRange(1, 0, 0, 1, POWER2_OUT(progress))
        this.textAppearTween.progress(textProgress)
    },

    ///////////////
    // Hover
    animateHoverEnter() {
        this.hoverTween ? .kill()

        this.hoverTween = gsap.to(this.hoverAnimationData, {
            duration: this.hoverAnimationData.durationIn,
            progress: 1,
            ease: 'power2.out',
            onUpdate: () => {
                this.material.uniforms.uHoverProgress.value = this.hoverAnimationData.progress
            }
        })
    },

    animateHoverLeave() {
        this.hoverTween ? .kill()

        this.hoverTween = gsap.to(this.hoverAnimationData, {
            duration: this.hoverAnimationData.durationOut,
            progress: 0,
            ease: 'power2.out',
            onUpdate: () => {
                this.material.uniforms.uHoverProgress.value = this.hoverAnimationData.progress
            }
        })
    },

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
    },

    ///////////////
    // Text
    setTextAnimation() {
        this.textDisappearTween = gsap.fromTo(this.textAnimationData, {
            value: 1
        }, {
            value: 0,
            ease: 'linear',
            onUpdate: () => {
                this.material.uniforms.uTextOpacityProgress.value = this.textAnimationData.value
            },
            paused: true,
            immediateRender: false
        })

        this.textAppearTween = gsap.fromTo(this.textAnimationData, {
            value: 0
        }, {
            value: 1,
            ease: 'linear',
            onUpdate: () => {
                this.material.uniforms.uTextOpacityProgress.value = this.textAnimationData.value
            },
            paused: true,
            immediateRender: false
        })
    },

    revealText(textIndex) {
        const textInstance = this.rtTexturesInstances.find(item => item.id === 'typo')

        if (textInstance) {
            // Reveal animation (TypoOffscreen.js)
            textInstance ? .reveal ? .(textIndex)

            requestAnimationFrame(() => {
                this.textAnimationData.value = 1
                this.material.uniforms.uTextOpacityProgress.value = 1
            })
        }
    },

    ///////////////
    // Depth End
    animateDepthEndScale() {
        gsap.fromTo(this.depthScaleAnimationData, {
            scaleValue: this.depthScaleAnimationData.scaleStart
        }, {
            scaleValue: this.depthScaleAnimationData.scaleEnd,
            duration: this.depthScaleAnimationData.scaleDuration,
            ease: "power4.out",
            onUpdate: () => {
                this.material.uniforms.uDepthScale.value = this.depthScaleAnimationData.scaleValue
            },
            onComplete: () => {
                // Reset Swapped texture bool
                this.material.uniforms.uHasTextureSwapped.value = false

                // Reset depth end scale
                this.material.uniforms.uDepthScale.value = this.depthScaleAnimationData.scaleValue = this.depthScaleAnimationData.scaleStart
            }
        })
    },

    ///////////////
    // Reveal
    revealFull() {
        // Data
        const startScaleValue = 0
        const endScaleValue = this.maskData.idle

        // Timeline
        const timeline = gsap.timeline({
            onUpdate: () => {
                const currentProgress = timeline.progress()

                if (currentProgress > .9 && !this.isRevealed) { // 90% of total animation
                    // Reveal flag
                    this.isRevealed = true

                    // Add class intro
                    html.classList.add("has-intro-revealed");
                }
            },
            onComplete: () => {
                requestAnimationFrame(() => {
                    // Disable interactivity before reveal
                    this.moduleInstance.hasHoldAvailable = true

                    // Enable scroll
                    this.moduleInstance.call('start', null, 'Scroll')

                    // Add class logo
                    html.classList.add("has-logo-revealed");
                })
            }
        })

        // Reveal portal
        const portalProgress = {
            value: 0
        }
        timeline.to(portalProgress, {
            value: 1,
            duration: 1.2,
            ease: 'linear',
            onUpdate: () => {
                const easedValue = clamp(startScaleValue, endScaleValue, mapRange(0, 1, startScaleValue, endScaleValue, POWER2_OUT(portalProgress.value)))
                this.material.uniforms.uMaskProgress.value = easedValue
            }
        })

        // Anime Logo
        this.moduleInstance.call('animateLogo', {
            timeline: timeline,
            delay: '-=0.5',
            callback: () => {
                //  Anim Dive
                this.diveAnimation()
            }
        }, 'Logo')
    },

    revealMin() {
        // Data
        const startScaleValue = 0
        const endScaleValue = this.maskData.idle

        // Reveal flag
        this.isRevealed = true

        // Add class logo
        html.classList.add("has-logo-revealed");

        // Add class intro
        html.classList.add("has-intro-revealed");

        // Timeline
        const timeline = gsap.timeline({
            onComplete: () => {
                requestAnimationFrame(() => {
                    // Disable interactivity before reveal
                    this.moduleInstance.hasHoldAvailable = true
                        // Enable scroll
                    this.moduleInstance.call('start', null, 'Scroll')
                })
            }
        })

        // Reveal portal
        const portalProgress = {
            value: 0
        }
        timeline.to(portalProgress, {
            value: 1,
            duration: 1.2,
            ease: 'linear',
            onUpdate: () => {
                const easedValue = clamp(startScaleValue, endScaleValue, mapRange(0, 1, startScaleValue, endScaleValue, POWER2_OUT(portalProgress.value)))
                this.material.uniforms.uMaskProgress.value = easedValue
            },
            onComplete: () => {
                //  Anim Dive
                this.diveAnimation()
            }
        }, "+=1")
    },

    diveAnimation() {
        this.moduleInstance.hasHoldAvailable = false

        this.animateHoldDown(() => {
            this.holdUp(true)
            this.startMasterAnimation().then(() => {
                // Add class experience
                html.classList.add("has-experience-revealed");
                window.dispatchEvent(new CustomEvent("resetCursorBind"));
            })
        })
    }
}