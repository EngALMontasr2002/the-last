const DEFAULT_PORTAL_CIRCLE_WIDTH = 288 // Based on mask texture

export default finalSceneUniforms = {
    setInitialUniforms() {
        // Noise
        this.material.uniforms.uNoiseProgress.value = this.noiseAnimationData.value

        // Text Opacity
        this.material.uniforms.uTextOpacityProgress.value = this.textAnimationData.value

        // Depth Scale
        this.material.uniforms.uDepthScale.value = this.depthScaleAnimationData.scaleValue
        this.material.uniforms.uDepthScaleStart.value = this.depthScaleAnimationData.scaleStart

        // Swapped bool
        this.material.uniforms.uHasTextureSwapped.value = false
    },

    setRTTextureUniforms(uniform, texture) {
        this.material.uniforms[uniform].value = texture
    },

    setMaskIdleUniforms() {
        const idle = Math.round((1 / this.maskData.maxScale + Number.EPSILON) * 100) / 100
        this.maskData.idle = this.material.uniforms.uMaskIdle.value = idle
    },

    setMaskProgressUniforms() {
        if (this.isRevealed) {
            this.material.uniforms.uMaskProgress.value = this.maskData.idle
        }
    },

    setMaxMaskScaleUniforms(maskTextureScale) {
        const canvasWidth = this.$el.offsetWidth
        const canvasHeight = this.$el.offsetHeight

        // 1. Get texture scale (values based on background UV)
        const circleWidth = DEFAULT_PORTAL_CIRCLE_WIDTH * maskTextureScale

        // 2. Get mask original scale (use pythagore to cover a maximum of possibilities)
        const pythA = canvasHeight / 2
        const pythB = canvasWidth / 2
        const hypot = Math.hypot(pythA, pythB)

        // 3. Result
        const originalScale = (hypot / circleWidth) * 2
        const roundedScale = Math.round((originalScale + Number.EPSILON) * 100) / 100

        this.material.uniforms.uMaxMaskScale.value = roundedScale

        return roundedScale
    }
}