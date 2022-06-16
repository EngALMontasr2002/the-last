import { module } from 'modujs';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
gsap.registerPlugin(DrawSVGPlugin);

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        // UI
        this.$el = this.el
        this.$path = this.$('path')
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

        // Remove tl
        this.tl && this.tl.kill();
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    unbindEvents() {
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onFontsLoaded() {
        this.setTimeline()
    }

    ///////////////
    // Methods
    ///////////////
    setTimeline() {
        requestAnimationFrame(() => {
            this.tl = gsap.timeline({ repeat: -1, repeatDelay: 1 })
            this.tl.fromTo(this.$path, { drawSVG: '0% 0%' }, { duration: 1, drawSVG: '0% 100%', ease: 'power2.out' })
            this.tl.to(this.$path, { duration: 1, drawSVG: '100% 100%', ease: 'power2.in' }, '+=2')
        })
    }
}