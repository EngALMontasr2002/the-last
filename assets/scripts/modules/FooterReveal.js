import { module } from 'modujs';
import { clamp } from '../utils/maths';
import { html } from "../utils/environment";

export default class extends module {
    constructor(m) {
        super(m);

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onMouseEnterBind = this.onMouseEnter.bind(this)
        this.onMouseLeaveBind = this.onMouseLeave.bind(this)

        // UI
        this.$el = this.el
        this.$inner = this.$('inner')[0]

        this.speed = 0.5 // 0 to 1
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.bindEvents()
        this.getValues()

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
        this.$el.addEventListener("mouseenter", this.onMouseEnterBind)
        this.$el.addEventListener("mouseleave", this.onMouseLeaveBind)
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        this.$el.removeEventListener("mouseenter", this.onMouseEnterBind)
        this.$el.removeEventListener("mouseleave", this.onMouseLeaveBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        this.getValues()
    }

    onMouseEnter() {
        html.classList.add('is-footer-hovering')
    }

    onMouseLeave() {
        html.classList.remove('is-footer-hovering')
    }

    onProgress(progress) {
        requestAnimationFrame(() => {
            this.computeProgress(progress)
        })
    }

    onFontsLoaded() {
        this.getValues()
    }

    ///////////////
    // Methods
    ///////////////
    getValues() {
        this.footerHeight = this.$el.offsetHeight
        this.ratio = this.footerHeight / (window.innerHeight + this.footerHeight)
    }

    computeProgress(progress) {
        if (progress > .4) {
            html.setAttribute('data-scroll-theme', 'light')
        } else if (html.getAttribute('data-scroll-theme-main') != 'light') {
            html.setAttribute('data-scroll-theme', '')
        }

        const translate = this.speed * (this.footerHeight * (clamp((progress / this.ratio), 0, 1) - 1))
        this.$inner.style.transform = `translate3d(0, ${translate}px, 0)`
    }
}