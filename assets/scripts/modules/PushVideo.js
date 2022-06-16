import { module } from 'modujs';
import { clamp, map } from '../utils/maths';
import gsap from 'gsap/all'

export default class extends module {
    constructor(m) {
        super(m);

        // Data
        this.data = {
            startProgressThreshold: 0 / 2,
            endProgressThreshold: 2 / 2,
            startScale: 1,
            endScale: 1.3,
        }

        // UI
        this.$el = this.el
        this.$fading = this.$('fading')[0]
        this.$scaling = this.$('scaling')[0] // optional
        this.$video = this.$('video')[0]
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {}

    destroy() {
        super.destroy();
    }

    ///////////////
    // Callbacks
    ///////////////
    onProgress(scrollProgress) {
        if (!this.$fading && !this.$scaling) return
        const progress = Math.round((this.computeProgressData(scrollProgress) + Number.EPSILON) * 100) / 100

        this.fade(progress)
        if (this.$scaling) this.scale(progress)
    }

    onEnter() {
        this.$video.play()
        this.fadeIn()
    }

    onLeave() {
        this.$video.pause()
        this.fadeOut()
    }

    ///////////////
    // Methods
    ///////////////
    computeProgressData(scrollProgress) {
        return clamp(map(scrollProgress, this.data.startProgressThreshold, this.data.endProgressThreshold, 0, 1), 0, 1)
    }

    fade(progress) {
        const opacity = 1 - progress
        this.$fading.style.opacity = opacity
    }

    fadeIn() {
        gsap.to(this.$fading, { opacity: 1, duration: 0.2, ease: 'linear' })
    }

    fadeOut() {
        gsap.to(this.$fading, { opacity: 0, duration: 0.2, ease: 'linear' })
    }

    scale(progress) {
        const scale = progress * (this.data.endScale - this.data.startScale) + this.data.startScale
        this.$scaling.style.transform = 'scale3d(' + scale + ', ' + scale + ', 1)'
    }
}