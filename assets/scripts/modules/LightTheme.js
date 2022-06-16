import { module } from 'modujs'
import { html } from '../utils/environment'

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        // UI
        this.$el = this.el
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
        this.call('update', null, 'Scroll')
    }

    onFontsLoaded() {
        this.call('update', null, 'Scroll')
    }

    ///////////////
    // Methods
    ///////////////
    onEnterInView() {
        requestAnimationFrame(() => {
            html.setAttribute('data-scroll-theme', 'light')
        })
    }

    onExitInView() {
        requestAnimationFrame(() => {
            html.setAttribute('data-scroll-theme', '')
        })
    }
}