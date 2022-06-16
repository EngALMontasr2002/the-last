import { module } from 'modujs'
import { body } from '../utils/environment';

const DEFAULT_SCALE = 4.676; // based on motion

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        // UI
        this.$el = this.el
        this.$parts = this.$('part')
        this.$letters = Array.from(this.$('letter'))

        // Translate
        this.translateY = 0

        // Flag
        this.isAnimated = false
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.bindEvents()

        if (window.isFontsLoaded) {
            this.onFontsLoaded()
        }
    }

    destroy() {
        super.destroy()
        this.unbindEvents()
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        window.addEventListener("resizeEnd", this.onResizeBind)
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        this.computePosition()
        this.computeScale()
        this.applyStyle()
    }

    onFontsLoaded() {
        this.computePosition()
        this.computeScale()
        this.applyStyle()
    }

    ///////////////
    // Methods
    ///////////////
    updateScale(scale) {
        if (this.isAnimated) return
        this.computeScale(scale)
        this.applyStyle()
    }

    computePosition() {
        const defaultOffsetTop = this.$el.offsetTop
        const defaultOffsetHeight = this.$el.offsetHeight
        const halfH = window.innerHeight * .5
        this.translateY = halfH - defaultOffsetTop - (defaultOffsetHeight * .5)
    }

    computeScale(scale = 1) {
        this.scale = DEFAULT_SCALE * scale
    }

    applyStyle() {
        this.$el.style.transform = `translate3d(-50%, ${this.translateY}px, 0)`
        for (let $letter of this.$letters) {
            $letter.style.transform = `scale(${this.scale})`
        }
    }

    // Animation
    animateLogo({ timeline, delay, callback }) {
        // Remove events
        this.isAnimated = true
        this.unbindEvents()

        // UI 
        const $logo = document.querySelector('.js-logo');
        const logoTop = $logo.offsetTop
        const targetTop = (this.$el.offsetTop - logoTop) * -1

        // Timeline
        timeline.to(this.$parts, {
            duration: .8,
            y: 0,
            autoAlpha: 1,
            ease: "power2.out",
            stagger: {
                each: 0.05,
                from: "center"
            },
            onComplete: () => {
                setTimeout(callback, 300);
            }
        }, delay)

        timeline.addLabel('staggerEnd')

        timeline.to(this.$letters, {
            duration: .8,
            scale: 1,
            force3D: false,
            ease: "power3.inOut",
        }, 'staggerEnd+=.3')

        timeline.to(this.$el, {
            duration: .8,
            y: targetTop,
            scale: 1,
            force3D: true,
            ease: "power3.inOut",
        }, 'staggerEnd+=.3')
    }
}