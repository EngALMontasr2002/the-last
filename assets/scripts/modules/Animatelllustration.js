import { module } from 'modujs'
import gsap from 'gsap'

export default class extends module {
    constructor(m) {
        super(m)

        // UI
        this.$el = this.el
        this.$paths = this.$('path')
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.computeData()
    }

    destroy() {
        super.destroy()
    }

    ///////////////
    // Methods
    ///////////////
    computeData() {
        for (var i = this.$paths.length - 1; i >= 0; i--) {
            const length = this.$paths[i].getTotalLength()
            const duration = gsap.utils.random(7, 9, 0.1)

            this.$paths[i].style.setProperty("--length", `${length}px`)
            this.$paths[i].style.setProperty("--index", i)
            this.$paths[i].style.setProperty("--duration", duration)
        }
    }
}